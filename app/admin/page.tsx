"use client";

import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
  Settings,
  Heart,
  LayoutDashboard,
  Bell,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const STATS = [
  { label: "Total Guests", value: "150", icon: Users, color: "text-sage" },
  { label: "RSVPs Received", value: "128", icon: CheckCircle2, color: "text-accent" },
  { label: "Pending Responses", value: "22", icon: Clock, color: "text-amber-600" },
  { label: "Days Remaining", value: "198", icon: Heart, color: "text-rose-500" },
];

const UPCOMING_EVENTS = [
  {
    id: 1,
    title: "Vendor Meeting: Catering",
    date: "Oct 12, 2026",
    time: "2:00 PM",
    location: "Zoom",
  },
  {
    id: 2,
    title: "Venue Final Walkthrough",
    date: "Oct 15, 2026",
    time: "10:00 AM",
    location: "The Grand Estate",
  },
  {
    id: 3,
    title: "Rehearsal Dinner",
    date: "Oct 21, 2026",
    time: "6:00 PM",
    location: "Downtown Bistro",
  },
];

const TASKS = [
  { id: 1, title: "Finalize seating chart", completed: false },
  { id: 2, title: "Send out remaining invites", completed: true },
  { id: 3, title: "Confirm photographer timeline", completed: false },
  { id: 4, title: "Order wedding favors", completed: false },
];

export default function AdminDashboard() {
  const [tasks, setTasks] = useState(TASKS);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-warm-white border-r border-border/40 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/40">
          <Link href="/" className="font-display text-xl font-semibold tracking-wide text-accent flex items-center gap-2">
            <Heart className="w-5 h-5 fill-accent" />
            <span>M & S Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 bg-accent/10 text-accent rounded-lg font-medium transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:bg-black/5 rounded-lg font-medium transition-colors">
            <Users className="w-5 h-5" />
            Guests
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:bg-black/5 rounded-lg font-medium transition-colors">
            <Calendar className="w-5 h-5" />
            Events
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:bg-black/5 rounded-lg font-medium transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-border/40">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-rose-500 hover:bg-rose-50 rounded-lg font-medium transition-colors">
            <LogOut className="w-5 h-5" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-warm-white border-b border-border/40 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 bg-background/50 px-4 py-2 rounded-full border border-border/50 focus-within:border-accent/50 focus-within:bg-white transition-colors max-w-md w-full">
            <Search className="w-4 h-4 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search guests, tasks, or events..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-text-secondary/70 text-foreground"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-text-secondary hover:bg-black/5 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-warm-white"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-display font-bold text-lg">
              M
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            
            {/* Welcome Section */}
            <div>
              <h1 className="text-3xl font-display font-semibold text-foreground">Welcome back, Murtaza!</h1>
              <p className="text-text-secondary mt-1">Here's what's happening with your wedding planning today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATS.map((stat, idx) => (
                <div key={idx} className="bg-warm-white p-6 rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-background ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-display font-semibold text-foreground">{stat.value}</h3>
                    <p className="text-sm text-text-secondary font-medium">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Upcoming Events Planner */}
              <div className="col-span-1 lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    Upcoming Agenda
                  </h2>
                  <button className="text-sm text-accent hover:text-accent-light font-medium transition-colors">
                    View full calendar &rarr;
                  </button>
                </div>
                
                <div className="bg-warm-white rounded-2xl border border-border/40 shadow-sm overflow-hidden">
                  <div className="divide-y divide-border/40">
                    {UPCOMING_EVENTS.map((event) => (
                      <div key={event.id} className="p-5 hover:bg-background/50 transition-colors flex items-start gap-4 cursor-pointer group">
                        <div className="bg-accent/10 text-accent rounded-xl w-14 h-14 flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-bold uppercase">{event.date.split(' ')[0]}</span>
                          <span className="text-lg font-display font-bold leading-none">{event.date.split(' ')[1].replace(',', '')}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground group-hover:text-accent transition-colors">{event.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {event.time}</span>
                            <span>&bull;</span>
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div className="col-span-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-sage" />
                    To-Do List
                  </h2>
                  <button className="text-sm text-accent hover:text-accent-light font-medium transition-colors">
                    Add task +
                  </button>
                </div>

                <div className="bg-warm-white rounded-2xl border border-border/40 shadow-sm p-2">
                  <div className="space-y-1">
                    {tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer"
                        onClick={() => toggleTask(task.id)}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          task.completed 
                            ? 'bg-sage border-sage text-white' 
                            : 'border-border'
                        }`}>
                          {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-sm flex-1 transition-all ${
                          task.completed ? 'text-text-secondary line-through' : 'text-foreground font-medium'
                        }`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Action Widget */}
                <div className="mt-6 bg-gradient-to-br from-accent to-accent-light rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 opacity-10">
                    <Heart className="w-32 h-32" />
                  </div>
                  <h3 className="font-display text-xl font-semibold relative z-10">Invite Guests</h3>
                  <p className="text-white/80 text-sm mt-1 mb-4 relative z-10">Share the digital invitation with your friends and family.</p>
                  <button className="w-full bg-white text-accent hover:bg-cream-dark py-2 rounded-lg text-sm font-semibold transition-colors relative z-10 shadow-sm">
                    Copy Invite Link
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
