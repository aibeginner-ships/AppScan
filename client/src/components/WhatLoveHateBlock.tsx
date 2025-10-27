import { Card } from "@/components/ui/card";
import { Heart, ThumbsDown } from "lucide-react";

interface WhatLoveHateBlockProps {
  whatUsersLove: string[];
  whatUsersHate: string[];
}

export default function WhatLoveHateBlock({ whatUsersLove, whatUsersHate }: WhatLoveHateBlockProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
            <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold">What Users Love</h3>
        </div>
        <ul className="space-y-3" data-testid="list-what-users-love">
          {whatUsersLove.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-medium text-green-600 dark:bg-green-950 dark:text-green-400">
                {index + 1}
              </span>
              <p className="text-muted-foreground" data-testid={`love-item-${index}`}>
                {item}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
            <ThumbsDown className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold">What Users Hate</h3>
        </div>
        <ul className="space-y-3" data-testid="list-what-users-hate">
          {whatUsersHate.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                {index + 1}
              </span>
              <p className="text-muted-foreground" data-testid={`hate-item-${index}`}>
                {item}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
