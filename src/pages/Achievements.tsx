import React from 'react';
import { Navigate } from 'react-router-dom';

/** @deprecated Use `/progress` with tab `achievements` — kept for bookmarks and old links. */
export function AchievementsPage() {
  return <Navigate to="/progress?tab=achievements" replace />;
}
