import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Home01Icon,
  Clock01Icon,
  Alert01Icon,
  File01Icon,
  ShieldCheckIcon as HShieldCheckIcon,
  PlayCircle02Icon,
  Folder01Icon,
  Link01Icon,
  UserGroupIcon,
  Settings01Icon,
  HelpCircleIcon,
  Cards01Icon,
  UserIcon as HUserIcon,
  Search01Icon,
  CommandIcon as HCommandIcon,
  Notification01Icon,
  ArrowDown01Icon,
  Cancel01Icon,
  SidebarLeftIcon,
  PlayIcon as HPlayIcon,
  PauseIcon as HPauseIcon,
  ArrowUpRight01Icon,
  CheckmarkBadge01Icon,
  ArrowReloadHorizontalIcon,
  Loading02Icon,
  ListSettingIcon,
  FileUploadIcon,
  CheckmarkCircle01Icon,
  Alert02Icon,
  ArrowRight01Icon,
  Delete01Icon,
  PlusSignIcon,
  ListIcon as HListIcon,
  ArrowUp01Icon,
  CpuIcon as HCpuIcon,
  Layers01Icon,
  BookOpen01Icon,
  Logout01Icon,
  SparkleIcon,
  LinkSquare01Icon,
  MoreHorizontalIcon as HMoreHorizontalIcon
} from '@hugeicons/core-free-icons'

type IconProps = SVGProps<SVGSVGElement> & { pressed?: boolean }

function IconWrapper({ icon, className, pressed, ...props }: IconProps & { icon: any }) {
  return (
    <HugeiconsIcon
      icon={icon}
      className={cn('size-5', className, pressed ? 'translate-x-0' : '')}
      strokeWidth={1.5}
      {...(props as any)}
    />
  )
}

export function HomeIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Home01Icon} className={className} {...props} /> }
export function ClockIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Clock01Icon} className={className} {...props} /> }
export function WarningIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Alert01Icon} className={className} {...props} /> }
export function FileIcon({ className, ...props }: IconProps) { return <IconWrapper icon={File01Icon} className={className} {...props} /> }
export function ShieldCheckIcon({ className, ...props }: IconProps) { return <IconWrapper icon={HShieldCheckIcon} className={className} {...props} /> }
export function PlayCircleIcon({ className, ...props }: IconProps) { return <IconWrapper icon={PlayCircle02Icon} className={className} {...props} /> }
export function FolderIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Folder01Icon} className={className} {...props} /> }
export function LinkIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Link01Icon} className={className} {...props} /> }
export function UsersIcon({ className, ...props }: IconProps) { return <IconWrapper icon={UserGroupIcon} className={className} {...props} /> }
export function GearIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Settings01Icon} className={className} {...props} /> }
export function QuestionIcon({ className, ...props }: IconProps) { return <IconWrapper icon={HelpCircleIcon} className={className} {...props} /> }

export function ToggleIcon({ className, pressed, ...props }: IconProps) {
  return (
    <div className={cn("relative flex items-center justify-center transition-transform", pressed ? 'scale-95' : '')}>
      <IconWrapper icon={Cards01Icon} className={className} {...props} />
    </div>
  )
}

export function UserIcon({ className, ...props }: IconProps) { return <IconWrapper icon={HUserIcon} className={className} {...props} /> }
export function SearchIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Search01Icon} className={cn('size-4', className)} {...props} /> }
export function CommandIcon({ className, ...props }: IconProps) { return <IconWrapper icon={HCommandIcon} className={cn('size-3', className)} {...props} /> }
export function BellIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Notification01Icon} className={className} {...props} /> }
export function CaretDownIcon({ className, ...props }: IconProps) { return <IconWrapper icon={ArrowDown01Icon} className={cn('size-4', className)} {...props} /> }
export function CloseIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Cancel01Icon} className={className} {...props} /> }
export function SidebarCollapseIcon({ className, ...props }: IconProps) { return <IconWrapper icon={SidebarLeftIcon} className={cn('size-4', className)} {...props} /> }
export function PlayIcon({ className, ...props }: IconProps) { return <IconWrapper icon={HPlayIcon} className={cn('size-4', className)} {...props} /> }
export function PauseIcon({ className, ...props }: IconProps) { return <IconWrapper icon={HPauseIcon} className={cn('size-4', className)} {...props} /> }
export function ArrowUpRightIcon({ className, ...props }: IconProps) { return <IconWrapper icon={ArrowUpRight01Icon} className={cn('size-4', className)} {...props} /> }
export function SealCheckIcon({ className, ...props }: IconProps) { return <IconWrapper icon={CheckmarkBadge01Icon} className={className} {...props} /> }
export function ArrowsCounterClockwiseIcon({ className, ...props }: IconProps) { return <IconWrapper icon={ArrowReloadHorizontalIcon} className={className} {...props} /> }
export function SpinnerGapIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Loading02Icon} className={className} {...props} /> }
export function FadersHorizontalIcon({ className, ...props }: IconProps) { return <IconWrapper icon={ListSettingIcon} className={className} {...props} /> }
export function FileArrowUpIcon({ className, ...props }: IconProps) { return <IconWrapper icon={FileUploadIcon} className={className} {...props} /> }
export function CheckCircleIcon({ className, ...props }: IconProps) { return <IconWrapper icon={CheckmarkCircle01Icon} className={className} {...props} /> }
export function TimelineCheckIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Clock01Icon} className={className} {...props} /> }
export function StatusWarningIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Alert02Icon} className={className} {...props} /> }
export function ArrowRightIcon({ className, ...props }: IconProps) { return <IconWrapper icon={ArrowRight01Icon} className={className} {...props} /> }
export function TrashIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Delete01Icon} className={className} {...props} /> }
export function PlusIcon({ className, ...props }: IconProps) { return <IconWrapper icon={PlusSignIcon} className={className} {...props} /> }
export function ListIcon({ className, ...props }: IconProps) { return <IconWrapper icon={HListIcon} className={className} {...props} /> }
export function ArrowUpIcon({ className, ...props }: IconProps) { return <IconWrapper icon={ArrowUp01Icon} className={className} {...props} /> }
export function CpuIcon({ className, ...props }: IconProps) { return <IconWrapper icon={HCpuIcon} className={className} {...props} /> }
export function SquareIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Layers01Icon} className={className} {...props} /> }
export function BookOpenIcon({ className, ...props }: IconProps) { return <IconWrapper icon={BookOpen01Icon} className={className} {...props} /> }
export function LogOutIcon({ className, ...props }: IconProps) { return <IconWrapper icon={Logout01Icon} className={className} {...props} /> }
export function SparklesIcon({ className, ...props }: IconProps) { return <IconWrapper icon={SparkleIcon} className={className} {...props} /> }
export function ExternalLinkIcon({ className, ...props }: IconProps) { return <IconWrapper icon={LinkSquare01Icon} className={className} {...props} /> }
export function MoreHorizontalIcon({ className, ...props }: IconProps) { return <IconWrapper icon={HMoreHorizontalIcon} className={className} {...props} /> }