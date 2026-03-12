'use client';

import { motion } from 'framer-motion';
import { Inbox, Calendar, Users, MessageSquare, BookOpen, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { AdminSession } from '@/lib/auth';

interface AdminDashboardProps {
  session: AdminSession;
}

const quickLinks = [
  {
    href: '/admin/inquiries',
    label: 'Inquiries',
    description: 'View contact form submissions',
    icon: Inbox,
    gradient: 'from-primary to-accent',
    bg: 'bg-primary/10',
  },
  {
    href: '/admin/appointments',
    label: 'Appointments',
    description: 'Manage calendar & bookings',
    icon: Calendar,
    gradient: 'from-secondary to-primary',
    bg: 'bg-secondary/10',
  },
  {
    href: '/admin/contacts',
    label: 'Contacts',
    description: 'View patient contact list',
    icon: Users,
    gradient: 'from-accent to-tertiary',
    bg: 'bg-accent/10',
  },
  {
    href: '/admin/messages',
    label: 'Messages',
    description: 'Conversations & SMS',
    icon: MessageSquare,
    gradient: 'from-tertiary to-secondary',
    bg: 'bg-tertiary/10',
  },
  {
    href: '/admin/blog',
    label: 'Blog',
    description: 'Manage website blog posts',
    icon: BookOpen,
    gradient: 'from-primary to-secondary',
    bg: 'bg-primary/10',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function AdminDashboard({ session }: AdminDashboardProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {greeting},{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {session.name.split(' ')[0]}
          </span>
        </h1>
        <p className="text-muted-foreground">
          Welcome to the Akaal Psychiatry admin portal.
        </p>
      </motion.div>

      {/* Quick access cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Quick Access</h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {quickLinks.map((item) => (
            <motion.div key={item.href} variants={itemVariants}>
              <Link
                href={item.href}
                className="group flex flex-col gap-4 p-6 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className={`inline-flex w-12 h-12 ${item.bg} rounded-xl items-center justify-center`}>
                  <item.icon className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{item.label}</h3>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Setup reminder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-5 bg-muted/50 border border-border rounded-2xl"
      >
        <h3 className="font-medium text-foreground mb-2">Getting started</h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            Configure CRM integration keys in Vercel environment variables
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            Set the contact form ID to start seeing inquiries
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
            Run the Supabase migration <code className="text-xs bg-muted px-1.5 py-0.5 rounded">supabase/migrations/001_admin_setup.sql</code>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
            Add staff emails to <code className="text-xs bg-muted px-1.5 py-0.5 rounded">akaal_psychiatry_admin_users</code> table
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
