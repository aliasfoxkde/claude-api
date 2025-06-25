/**
 * Basic Chat Example with OpenAI SDK
 * 
 * This example shows how to use the OpenAI SDK with the Puter Claude API Proxy
 * for basic chat completions. Simply change the baseURL to use Claude for free!
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client with Puter Claude API Proxy
const openai = new OpenAI({
  baseURL: process.env.PUTER_CLAUDE_BASE_URL || 'https://your-worker.your-subdomain.workers.dev/v1',
  apiKey: process.env.PUTER_CLAUDE_API_KEY || 'your-api-key-here',
});

async function basicChatExample() {
  try {
    console.log('🤖 Starting basic chat example with Claude via Puter...\n');

    // Simple chat completion
    const response = await openai.chat.completions.create({
      model: 'claude-3-5-sonnet',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that explains complex topics in simple terms.'
        },
        {
          role: 'user',
          content: 'Explain quantum computing in simple terms that a 10-year-old could understand.'
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    console.log('📝 Claude\'s Response:');
    console.log('─'.repeat(50));
    console.log(response.choices[0].message.content);
    console.log('─'.repeat(50));
    
    // Display usage information
    console.log('\n📊 Usage Information:');
    console.log(`Model: ${response.model}`);
    console.log(`Finish Reason: ${response.choices[0].finish_reason}`);
    console.log(`Response ID: ${response.id}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Handle specific error types
    if (error.status === 401) {
      console.error('🔑 Authentication failed. Please check your API key.');
    } else if (error.status === 429) {
      console.error('⏰ Rate limit exceeded. Please try again later.');
    } else if (error.status === 500) {
      console.error('🔧 Server error. Please try again or contact support.');
    }
  }
}

// Multi-turn conversation example
async function conversationExample() {
  try {
    console.log('\n💬 Starting conversation example...\n');

    const messages = [
      {
        role: 'system',
        content: 'You are a knowledgeable coding tutor. Help users learn programming concepts.'
      },
      {
        role: 'user',
        content: 'What is the difference between let, const, and var in JavaScript?'
      }
    ];

    // First response
    let response = await openai.chat.completions.create({
      model: 'claude-3-5-sonnet',
      messages: messages,
      max_tokens: 300,
      temperature: 0.5,
    });

    console.log('🤖 Claude:');
    console.log(response.choices[0].message.content);
    
    // Add Claude's response to conversation
    messages.push(response.choices[0].message);
    
    // Follow-up question
    messages.push({
      role: 'user',
      content: 'Can you give me a practical example of when to use each one?'
    });

    // Second response
    response = await openai.chat.completions.create({
      model: 'claude-3-5-sonnet',
      messages: messages,
      max_tokens: 400,
      temperature: 0.5,
    });

    console.log('\n🤖 Claude (follow-up):');
    console.log(response.choices[0].message.content);

  } catch (error) {
    console.error('❌ Conversation error:', error.message);
  }
}

// Different model comparison
async function modelComparisonExample() {
  try {
    console.log('\n🔬 Comparing different Claude models...\n');

    const prompt = 'Write a haiku about artificial intelligence.';
    const models = ['claude-3-5-sonnet', 'claude-sonnet-4', 'claude-opus-4'];

    for (const model of models) {
      try {
        const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.8,
        });

        console.log(`📝 ${model}:`);
        console.log(response.choices[0].message.content);
        console.log('─'.repeat(30));
      } catch (error) {
        console.log(`❌ ${model}: ${error.message}`);
        console.log('─'.repeat(30));
      }
    }

  } catch (error) {
    console.error('❌ Model comparison error:', error.message);
  }
}

// Temperature comparison example
async function temperatureExample() {
  try {
    console.log('\n🌡️ Temperature comparison example...\n');

    const prompt = 'Complete this story: "The old lighthouse keeper noticed something strange in the fog..."';
    const temperatures = [0.1, 0.5, 0.9];

    for (const temp of temperatures) {
      const response = await openai.chat.completions.create({
        model: 'claude-3-5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: temp,
      });

      console.log(`🌡️ Temperature ${temp}:`);
      console.log(response.choices[0].message.content);
      console.log('─'.repeat(40));
    }

  } catch (error) {
    console.error('❌ Temperature example error:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Puter Claude API Proxy - OpenAI SDK Examples\n');
  
  await basicChatExample();
  await conversationExample();
  await modelComparisonExample();
  await temperatureExample();
  
  console.log('\n✅ All examples completed!');
  console.log('\n💡 Tips:');
  console.log('- Adjust temperature for more/less creative responses');
  console.log('- Use system messages to set Claude\'s behavior');
  console.log('- Try different Claude models for various use cases');
  console.log('- Monitor your usage through the API dashboard');
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  basicChatExample,
  conversationExample,
  modelComparisonExample,
  temperatureExample
};
