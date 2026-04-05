# Aura Fitness - Private All-in-One Fitness & Self-Improvement App

## Current State
New project. Empty Motoko backend (default actor) and no frontend application yet.

## Requested Changes (Diff)

### Add
- Full Motoko backend with data models and APIs for all 11 core features
- React frontend with 5-tab bottom navigation (Home, Workout, Habits, Progress, Profile/AI Coach)
- Workout logging: custom/predefined exercises, sets/reps/weights, notes, start/end flow, duration tracking
- Smart rest timer: auto-start after set completion, adjustable duration, skip/extend, rest time tracking
- Exercise guidance: predefined exercise library with GIF/animation URLs and optional YouTube links
- Body metrics: weight/height logging, auto-calculated BMR, daily calorie requirements, macro breakdown
- AI Coach chat: context-aware chat using HTTP outcalls to AI service, remembers user data
- Habit tracking: custom habits (build/quit), daily completion, streak counts, completion percentages
- Weekly reflection journal: 3-prompt entries (went well / didn't go well / improvements), stored history
- Progress photo vault: private photo upload/storage via blob-storage, timeline view, side-by-side comparison
- Goal setting: fitness and habit goals with visual progress tracking
- Session summaries: post-workout recap (exercises, time, rest vs active)
- Weekly summaries: habit rate, workout consistency, weight changes
- Rewards: streak milestones and achievement badges (lightweight)
- Authorization: all data private per user

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
- User profile: age, sex, height, weight history with timestamps
- Workout sessions: exercises, sets (reps, weight, notes, timestamps), start/end times, rest time tracking
- Exercise library: predefined exercises with name, muscle group, animation URL, YouTube URL
- Habit records: habit definitions (name, type: build/quit), daily completions, streak calculation
- Journal entries: weekly reflections with 3 structured fields + timestamp
- Goals: title, type, target value, current value, deadline
- Achievement/badge records per user
- AI Coach: store chat history; HTTP outcalls to AI API for responses with user context injected
- Progress photos: stored via blob-storage with timestamps, private per user

### Frontend (React)
- Bottom navigation: Home, Workout, Habits, Progress, Profile
- Home dashboard: habit quick-check, last workout card, streak display, weight reminder, quick action buttons
- Workout screen: active workout flow with exercise list, set logger, prominent rest timer overlay
- Exercise detail modal: animation/GIF, YouTube link, set input
- Habit tracker: habit list, check/uncheck, streaks, stats
- Progress screen: weight line chart, habit consistency bar chart, photo timeline with compare mode
- AI Coach: chat UI with message history and context-aware responses
- Journal: weekly prompt form + past entries list
- Goals screen: goal cards with progress bars
- Body metrics screen: weight/height input, BMR/calorie/macro display
- Authorization flow: login/signup screen
