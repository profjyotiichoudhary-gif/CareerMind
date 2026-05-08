import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CAREER_SYSTEM_PROMPT = `You are CareerMind, an expert AI Career Guidance Mentor and Skill Intelligence Engine. 
Your sole purpose is to help students, freshers, job seekers, and professionals navigate their career journeys.

CORE CAPABILITIES:
1. Analyze resumes and extract technical + soft skills
2. Recommend top matching career roles with match scores
3. Identify skill gaps for any target role
4. Generate month-by-month personalized learning roadmaps
5. Provide conversational career mentorship
6. Generate interview preparation questions + answers
7. Give resume improvement tips

BEHAVIORAL RULES:
- Always be encouraging, specific, and practical
- Use real-world company and tool examples
- When returning structured data, output ONLY valid JSON
- Never add preamble or markdown around JSON responses
- Tailor advice to the user's experience level
- If a question is outside career guidance, politely redirect
TONE: Professional yet warm. Like a senior mentor, not a bot.`;

export async function extractSkills(resumeText: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this resume and extract structured information.
    Resume text:
    ${resumeText.slice(0, 4000)}`,
    config: {
      systemInstruction: CAREER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          technical_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          soft_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          experience_years: { type: Type.NUMBER },
          education: { type: Type.STRING },
          current_role: { type: Type.STRING, nullable: true }
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function recommendCareers(skills: string[], experienceYears: number = 0) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on these skills and experience, recommend the top 5 career roles.
    Skills: ${skills.join(", ")}
    Experience: ${experienceYears} years`,
    config: {
      systemInstruction: CAREER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING },
            match_score: { type: Type.NUMBER },
            description: { type: Type.STRING },
            required_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            companies: { type: Type.ARRAY, items: { type: Type.STRING } },
            avg_salary: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function analyzeSkillGap(currentSkills: string[], targetRole: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the skill gap for this career target.
    Current skills: ${currentSkills.join(", ")}
    Target role: ${targetRole}`,
    config: {
      systemInstruction: CAREER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          partial_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          strong_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          match_percentage: { type: Type.NUMBER },
          priority_to_learn: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimated_gap_months: { type: Type.NUMBER }
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateRoadmap(missingSkills: string[], targetRole: string, months: number = 6) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a ${months}-month personalized learning roadmap.
    Target role: ${targetRole}
    Skills to learn: ${missingSkills.join(", ")}`,
    config: {
      systemInstruction: CAREER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            month: { type: Type.NUMBER },
            focus: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            milestones: { type: Type.ARRAY, items: { type: Type.STRING } },
            resources: { type: Type.ARRAY, items: { type: Type.STRING } },
            project_idea: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateInterviewQuestions(targetRole: string, skills: string[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 10 interview questions for a ${targetRole} role.
    Candidate skills: ${skills.slice(0, 10).join(", ")}`,
    config: {
      systemInstruction: CAREER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            type: { type: Type.STRING, description: "technical|behavioral|situational" },
            sample_answer: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function getResumeTips(resumeText: string, skills: string[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Review this resume and provide 5 specific improvement tips.
    Detected skills: ${skills.slice(0, 15).join(", ")}
    Resume text (first 2000 chars): ${resumeText.slice(0, 2000)}`,
    config: {
      systemInstruction: CAREER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function careerChat(history: { role: 'user' | 'model', content: string }[], message: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: CAREER_SYSTEM_PROMPT,
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }))
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
