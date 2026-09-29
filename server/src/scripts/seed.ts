import bcrypt from 'bcryptjs';
import path from 'path';
import { connectDB, disconnectDB } from '../db/connection.js';
import { User } from '../models/User.js';
import { BrandVoice } from '../models/BrandVoice.js';
import { ProviderSession } from '../models/ProviderSession.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

async function seed(): Promise<void> {
  logger.info('🌱 Starting database seed...');
  await connectDB();

  // 1. Seed Admin User
  const existingUsers = await User.countDocuments();
  if (existingUsers === 0) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(env.DEFAULT_ADMIN_PASSWORD, salt);

    await User.create({
      email: env.DEFAULT_ADMIN_EMAIL.toLowerCase().trim(),
      passwordHash,
      role: 'admin'
    });
    logger.info(`✅ Default admin created: ${env.DEFAULT_ADMIN_EMAIL}`);
  } else {
    logger.info('ℹ️ User already exists, skipping admin seed.');
  }

  // 2. Seed Default Brand Voice
  const existingVoice = await BrandVoice.findOne();
  if (!existingVoice) {
    await BrandVoice.create({
      tone: 'Authoritative, insightful, accessible, and high-energy.',
      niche: 'Artificial Intelligence, SaaS engineering, developer tools, and workflow automation.',
      audience: 'Founders, senior software engineers, tech creators, and product builders.',
      dos: [
        'Lead with strong punchy hooks that grab attention within 2 lines',
        'Use clean formatting with bullet points and line breaks for readability',
        'Include practical metrics, code insights, or architecture diagrams',
        'End with conversational questions or clear calls-to-action'
      ],
      donts: [
        'Never use generic AI buzzwords like "unleash", "game-changer", "dive in", "tapestry"',
        'Avoid walls of text without paragraph breaks',
        'No clickbait without delivering real substance'
      ],
      samplePosts: [
        'Most engineers build automation upside down: they write code first, then try to fit prompts into it.\n\nThe right way: prototype the prompt in production-grade LLM interfaces, stress test edge cases, then automate the browser/API wrapper around it.\n\nHere are 3 rules for reliable AI pipelines 🧵👇'
      ]
    });
    logger.info('✅ Default Brand Voice seeded.');
  } else {
    logger.info('ℹ️ Brand Voice already exists, skipping.');
  }

  // 3. Seed Provider Sessions
  const providers = ['gemini', 'chatgpt'] as const;
  for (const provider of providers) {
    const existing = await ProviderSession.findOne({ provider });
    if (!existing) {
      const profilePath = path.resolve(env.STORAGE_DIR, 'profiles', provider);
      await ProviderSession.create({
        provider,
        status: 'login_required',
        profilePath,
        meta: {
          lastHealthCheck: null,
          initialized: true
        }
      });
      logger.info(`✅ Provider session initialized for: ${provider}`);
    }
  }

  logger.info('🌱 Database seeding completed successfully.');
  await disconnectDB();
  process.exit(0);
}

seed().catch(async (error) => {
  logger.error({ error }, '❌ Database seed failed');
  await disconnectDB();
  process.exit(1);
});
