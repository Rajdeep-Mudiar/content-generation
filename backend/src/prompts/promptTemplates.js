export const TOPICS = [
  'AI', 'ML', 'Deep Learning', 'CNN', 'Computer Vision', 'AI Agents',
  'LangChain', 'LangGraph', 'RAG', 'Generative AI', 'LLM Engineering',
  'AI News', 'AI Roadmaps', 'AI Resources', 'AI Tutorials',
  'AI Career Advice', 'AI Projects', 'AI Startups', 'Open Source AI'
];

export const getPromptForPlatform = (platform, topic) => {
  const commonInstructions = `
    Tone: Friendly, Informal, Beginner-friendly, Human-sounding, Engaging, Shareable.
    Focus on: ${topic}.
    Output must be in valid JSON format with the following structure:
    {
      "title": "string",
      "content": "string (markdown)",
      "hashtags": ["string"],
      "cta": "string",
      "seoTitle": "string",
      "seoDescription": "string",
      "keywords": ["string"],
      "imagePrompt": "string",
      "thumbnailIdea": "string"
    }
  `;

  const platforms = {
    Quora: `
      Task: Write a detailed, helpful Quora answer.
      Context: Someone asked a question about ${topic}.
      Requirements: Start with a personal-sounding hook, provide value, use bullet points if needed, and keep it conversational.
      ${commonInstructions}
    `,
    LinkedIn: `
      Task: Write an engaging LinkedIn post.
      Context: Sharing insights or news about ${topic}.
      Requirements: Use line breaks for readability, start with a strong hook, include a call to action, and use relevant emojis sparingly.
      ${commonInstructions}
    `,
    Medium: `
      Task: Write a high-quality Medium article.
      Context: An educational or opinion piece on ${topic}.
      Requirements: Include an introduction, subheadings, detailed explanation, and a conclusion. Use a storytelling approach.
      ${commonInstructions}
    `
  };

  return platforms[platform] || platforms.LinkedIn;
};
