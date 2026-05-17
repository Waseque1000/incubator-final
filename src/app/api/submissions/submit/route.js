import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/lib/models/Submission';
import Student from '@/lib/models/Student';
import Form from '@/lib/models/Form';

export async function POST(req) {
  try {
    await dbConnect();
    const { formId, name, email, phone, batch, currentModule, tomorrowTask, needGuideline, customData } = await req.json();
    
    // Find or create student
    let student = await Student.findOne({ email, formId });
    if (!student) {
      student = new Student({ name, email, phone, batch, formId });
      await student.save();
    }

    // Calculate assignedModule
    let assignedModule = student.assignedModule;
    
    if (!assignedModule) {
      let assignedModuleStr = String(currentModule);
      assignedModule = assignedModuleStr;
      const match = assignedModuleStr.match(/(\d+)/);
      if (match) {
         const num = parseInt(match[1]) + 1;
         assignedModule = assignedModuleStr.replace(match[1], num);
      } else {
         assignedModule = currentModule + ' + 1';
      }
    } else {
      student.assignedModule = "";
      await student.save();
    }

    // Calculate date and time in Bangladesh (UTC+6)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bdTime = new Date(utc + (3600000 * 6));
    
    const bangladeshDate = bdTime.toISOString().split('T')[0];
    const submissionTime = bdTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    });

    const submission = new Submission({
      studentId: student._id,
      formId,
      date: bangladeshDate,
      submissionTime,
      currentModule,
      assignedModule,
      tomorrowTask,
      needGuideline: needGuideline || false,
      customData: customData || {}
    });

    await submission.save();

    // Discord Notification
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
    if (DISCORD_WEBHOOK_URL) {
      try {
        const form = await Form.findById(formId);
        const embed = {
          title: needGuideline ? '🚨 GUIDELINE HELP REQUESTED 🚨' : '✅ DAILY PROGRESS SUBMITTED',
          description: `**Form:** ${form?.formName || 'General Campaign'}\n**Status:** ${needGuideline ? 'Requires Attention ⚠️' : 'On Track 💎'}`,
          color: needGuideline ? 0xEF4444 : 0x10B981,
          thumbnail: { url: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' },
          fields: [
            { name: '👤 Student Identity', value: `**Name:** ${name}\n**Email:** ${email}\n**Batch:** ${batch || 'N/A'}`, inline: false },
            { name: '📊 Progress Details', value: `**Current Module:** ${currentModule}\n**Submission Time:** ${submissionTime}`, inline: false },
            { name: '🎯 Tomorrow\'s Mission', value: tomorrowTask || '_No plan provided_', inline: false },
          ],
          timestamp: new Date().toISOString(),
          footer: { 
            text: 'Incubator Management System • Built with Antigravity',
            icon_url: 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png'
          }
        };

        if (customData && Object.keys(customData).length > 0) {
          let customFieldsText = Object.entries(customData)
            .map(([key, val]) => `🔹 **${key}:** ${val}`)
            .join('\n');
          embed.fields.push({ name: '📋 Additional Info', value: customFieldsText });
        }

        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Incubator Bot',
            avatar_url: 'https://cdn-icons-png.flaticon.com/512/1782/1782803.png',
            embeds: [embed]
          })
        });
      } catch (discordErr) {
        console.error('❌ Discord Webhook Error:', discordErr.message);
      }
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
       return NextResponse.json({ message: 'You have already submitted for today.' }, { status: 400 });
    }
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
