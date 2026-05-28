export const TOPICS = [
  'AI', 'ML', 'Deep Learning', 'CNN', 'Computer Vision', 'AI Agents',
  'LangChain', 'LangGraph', 'RAG', 'Generative AI', 'LLM Engineering',
  'AI News', 'AI Roadmaps', 'AI Resources', 'AI Tutorials',
  'AI Career Advice', 'AI Projects', 'AI Startups', 'Open Source AI'
];

export const getPromptForPlatform = (platform, topic) => {
  const commonInstructions = `
    Focus on: ${topic}.
    The output MUST be a valid JSON object. Do not include any text before or after the JSON.
    JSON Structure:
    {
      "title": "A catchy title",
      "content": "The main content in markdown format",
      "hashtags": ["#tag1", "#tag2"],
      "cta": "Call to action",
      "seoTitle": "SEO optimized title",
      "seoDescription": "SEO optimized description",
      "keywords": ["keyword1", "keyword2"],
      "imagePrompt": "Detailed prompt for an AI image generator",
      "thumbnailIdea": "Idea for a YouTube/Blog thumbnail"
    }
  `;

  const platforms = {
    Quora: `
      Task: Write a detailed, helpful Quora answer.
      Context: Someone asked a question about ${topic}.
      Tone: Helpful, educational, personal.
      Requirements: Start with a personal-sounding hook, provide deep value, use bullet points for readability.
      ${commonInstructions}
    `,
    LinkedIn: `
      Task: Write an engaging LinkedIn post.
      Context: Sharing insights or news about ${topic}.
      Tone: Professional yet conversational, engaging.
      Requirements: Use line breaks, start with a strong hook, use emojis sparingly, end with a question to drive engagement.
      ${commonInstructions}
    `,
    Medium: `
      Task: Write a high-quality Medium article.
      Context: An educational or opinion piece on ${topic}.
      Tone: Informative, storytelling, thought-provoking.
      Requirements: Detailed introduction, subheadings, comprehensive coverage, and a conclusion.
      ${commonInstructions}
    `
  };

  return platforms[platform] || platforms.LinkedIn;
};
