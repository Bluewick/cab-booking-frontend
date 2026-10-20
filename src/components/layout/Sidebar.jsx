import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Obsidian Geist Sidebar Component
 * Provides docked, responsive navigation for Driver and Admin operational views
 */
export default function Sidebar({
  title,
  items = [], // { label, path, icon: Icon, badge? }
  className = '',
}) {
  return (
    <aside
      className={`
        w-64 shrink-0 bg-[#0F0F12] border-r border-[#27272A] p-4 flex flex-col gap-6
        min-h-[calc(100vh-4rem)]
        ${className}
      `}
    >
      {title && (
        <div className="px-3 pb-2 border-b border-[#27272A]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] font-mono">
            {title}
          </h2>
        </div>
      )}

      <nav className="flex flex-col gap-1.5 flex-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `
                flex items-center justify-between px-3 py-2.5 rounded-[8px] text-xs font-medium
                transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]
                ${
                  isActive
                    ? 'bg-[#1C1C21] text-[#FAFAFA] border border-[#27272A] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#141418]'
                }
              `}
            >
              <div className="flex items-center gap-2.5">
                {Icon && <Icon className="size-4 shrink-0" />}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-[#27272A] text-[#FAFAFA]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
