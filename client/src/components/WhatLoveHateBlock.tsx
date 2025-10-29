import { Card } from "@/components/ui/card";
import { Heart, ThumbsDown } from "lucide-react";

interface WhatLoveHateBlockProps {
  whatUsersLove: string[];
  whatUsersHate: string[];
}

export default function WhatLoveHateBlock({ whatUsersLove, whatUsersHate }: WhatLoveHateBlockProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-950">
            <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-base font-semibold text-[#111827] dark:text-neutral-100">What Users Love</h3>
        </div>
        <ul className="space-y-3" data-testid="list-what-users-love">
          {whatUsersLove.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-[#6B7280] dark:text-neutral-300" data-testid={`love-item-${index}`}>
                {item}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950">
            <ThumbsDown className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-[#111827] dark:text-neutral-100">What Users Hate</h3>
        </div>
        <ul className="space-y-3" data-testid="list-what-users-hate">
          {whatUsersHate.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-[#6B7280] dark:text-neutral-300" data-testid={`hate-item-${index}`}>
                {item}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
