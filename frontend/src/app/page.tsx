'use client';

import Link from 'next/link';
import GlassCard from '../components/ui/GlassCard';
import NeonButton from '../components/ui/NeonButton';
import { motion } from 'framer-motion';
import { MessageSquare, Shield, Globe, Zap, Lock, Wallet } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'End-to-End Encryption',
      description: 'Military-grade encryption with ECDH + AES-256. Only you and the recipient can read your messages.',
      gradient: 'from-stitch-blue to-stitch-purple',
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Fully Decentralized',
      description: 'No central server, no single point of failure. Your messages are stored on a distributed blockchain network.',
      gradient: 'from-accent-green to-stitch-cyan',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Immutable & Permanent',
      description: 'Once sent, messages cannot be deleted or modified. Tamper-proof and permanent record.',
      gradient: 'from-stitch-pink to-accent-red',
    },
  ];

  const stats = [
    { value: '100%', label: 'Encrypted' },
    { value: '24/7', label: 'Available' },
    { value: '0', label: 'Downtime' },
    { value: '∞', label: 'Scalable' },
  ];

  return (
    <main className="min-h-screen relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-16"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-premium mb-8"
          >
            <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse shadow-glow-blue"></div>
            <span className="text-sm font-semibold text-text-secondary">
              🔒 End-to-End Encrypted Messaging
            </span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-extrabold mb-6">
            <span className="text-gradient block mb-2">Blockchain</span>
            <span className="text-white">Messenger</span>
          </h1>

          <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-12 leading-relaxed">
            Send secure, encrypted messages on the blockchain.{' '}
            <span className="text-gradient font-semibold">Decentralized</span>,{' '}
            <span className="text-gradient-pink font-semibold">Immutable</span>, and{' '}
            <span className="text-gradient-cyan font-semibold">Private</span>.
          </p>

          <div className="flex flex-wrap gap-6 justify-center">
            <Link href="/chat">
              <NeonButton variant="primary" size="lg" glow icon={<MessageSquare className="w-5 h-5" />}>
                Start Chatting
              </NeonButton>
            </Link>
            <Link href="/explorer">
              <NeonButton variant="secondary" size="lg" icon={<Zap className="w-5 h-5" />}>
                Explore Blockchain
              </NeonButton>
            </Link>
          </div>
        </motion.div>

        {/* Features Section */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            Why Choose <span className="text-gradient">Blockchain Messenger</span>?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard variant="premium" hoverEffect glow>
                  <div className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white shadow-xl`}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="font-bold text-xl mb-3 text-white">{feature.title}</h3>
                    <p className="text-text-secondary leading-relaxed">{feature.description}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard hoverEffect>
                <div className="text-center">
                  <div className="text-5xl font-bold text-gradient mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-dark">{stat.label}</div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <GlassCard variant="premium" className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-white">Ready to Get Started?</h2>
            <p className="text-text-secondary mb-8">
              Join the future of secure, decentralized messaging today.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/wallet">
                <NeonButton variant="primary" size="lg" glow icon={<Wallet className="w-5 h-5" />}>
                  Create Wallet
                </NeonButton>
              </Link>
              <Link href="/about">
                <NeonButton variant="ghost" size="lg">
                  Learn More
                </NeonButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  );
}
