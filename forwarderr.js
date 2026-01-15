const { Client, GatewayIntentBits } = require('discord.js');

// Load environment variables from .env file (if it exists)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, will use hardcoded values
}

// ============================================
// CONFIGURATION - REPLACE THESE VALUES
// ============================================
const CONFIG = {
  // Your Discord bot token (same as in workers.js)
  // For Railway: Set as environment variable DISCORD_BOT_TOKEN
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || 'MTQ2MTM0ODE5MDg3OTIyMzg0OA.GBwYjr.iBF92XxagkH-TNRt65AJp0r0k0eik2WqlvbFP4',
  
  // Your Cloudflare Worker URL (after deploying workers.js)
  // For Railway: Set as environment variable WORKER_URL
  WORKER_URL: process.env.WORKER_URL || 'https://steep-river-c995.thetruesammyjay.workers.dev/',
};
// ============================================

console.log('🚀 Starting Discord Gateway Forwarder...');
console.log(`📡 Forwarding to: ${CONFIG.WORKER_URL}`);
console.log(`🔑 Token (first 20 chars): ${CONFIG.DISCORD_BOT_TOKEN.substring(0, 20)}...`);
console.log(`🔑 Token length: ${CONFIG.DISCORD_BOT_TOKEN.length} characters`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.on('clientReady', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  console.log(`📊 Connected to ${client.guilds.cache.size} server(s)`);
  console.log('👂 Listening for member join events...');
});

client.on('guildMemberAdd', async (member) => {
  console.log(`\n👤 New member: ${member.user.username} joined ${member.guild.name}`);
  
  try {
    const response = await fetch(CONFIG.WORKER_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Signature-Ed25519': 'forwarder',
        'X-Signature-Timestamp': Date.now().toString()
      },
      body: JSON.stringify({
        t: 'GUILD_MEMBER_ADD',
        d: {
          user: {
            username: member.user.username,
            discriminator: member.user.discriminator,
            id: member.user.id
          },
          guild_id: member.guild.id
        }
      })
    });
    
    if (response.ok) {
      console.log('✅ Event forwarded successfully');
    } else {
      console.error(`❌ Forward failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error forwarding event:', error.message);
  }
});

client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

client.on('disconnect', () => {
  console.log('⚠️ Bot disconnected');
});

// Login to Discord
client.login(CONFIG.DISCORD_BOT_TOKEN)
  .catch(error => {
    console.error('❌ Failed to login:', error.message);
    process.exit(1);
  });

// Keep the process alive and handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});
