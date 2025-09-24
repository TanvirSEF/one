// components/section-cards.tsx
import { 
  IconUsers, 
  IconShield, 
  IconUserCheck,
  IconCrown
} from "@tabler/icons-react"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type MemberStats = {
  admins: number
  moderators: number 
  newThisWeek: number
}

export function SectionCards({ 
  totalMembers, 
  memberStats 
}: { 
  totalMembers?: number
  memberStats?: MemberStats 
}) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Total Members */}
      <Card className="bg-card border border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-sm font-medium">
            Total Members
          </CardDescription>
          <IconUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardFooter className="pt-0">
          <CardTitle className="text-2xl font-bold">
            {typeof totalMembers === "number" ? totalMembers.toLocaleString() : "-"}
          </CardTitle>
        </CardFooter>
      </Card>

      {/* Admins */}
      <Card className="bg-card border border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-sm font-medium">
            Admin Users
          </CardDescription>
          <IconCrown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardFooter className="pt-0">
          <CardTitle className="text-2xl font-bold">
            {memberStats?.admins || "-"}
          </CardTitle>
        </CardFooter>
      </Card>

      {/* Moderators */}
      <Card className="bg-card border border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-sm font-medium">
            Moderators
          </CardDescription>
          <IconShield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardFooter className="pt-0">
          <CardTitle className="text-2xl font-bold">
            {memberStats?.moderators || "-"}
          </CardTitle>
        </CardFooter>
      </Card>

      {/* New Members This Week */}
      <Card className="bg-card border border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-sm font-medium">
            New This Week
          </CardDescription>
          <IconUserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardFooter className="pt-0">
          <CardTitle className="text-2xl font-bold">
            {memberStats?.newThisWeek || "-"}
          </CardTitle>
        </CardFooter>
      </Card>
    </div>
  )
}