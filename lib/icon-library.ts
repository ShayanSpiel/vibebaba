/**
 * COMPREHENSIVE ICON LIBRARY
 *
 * Provides 200-300+ icon examples per library for AI to choose from.
 * SHORT format - just icon names, no descriptions (1-3 lines per category).
 *
 * Philosophy: Give AI MANY options, let it choose contextually appropriate ones.
 */

export interface IconLibrary {
  lucide: string[];
  heroicons: string[];
  materialIcons: string[];
}

/**
 * Lucide Icons - 250+ icons
 * Modern, clean, consistent design system
 */
export const LUCIDE_ICONS = {
  // Actions (30)
  actions: 'Plus, Minus, Edit, Edit2, Edit3, Trash, Trash2, Save, Copy, Cut, Clipboard, Download, Upload, Share, Share2, Send, MoreHorizontal, MoreVertical, Move, Maximize, Minimize, ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCw, Repeat, Undo, Redo, ExternalLink',

  // Navigation (30)
  navigation: 'ChevronRight, ChevronLeft, ChevronUp, ChevronDown, ChevronsRight, ChevronsLeft, ChevronsUp, ChevronsDown, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowUpRight, ArrowDownRight, ArrowUpLeft, ArrowDownLeft, Menu, X, Home, Sidebar, PanelLeft, PanelRight, Grid, List, Columns, Rows, SkipBack, SkipForward, FastForward, Rewind',

  // UI/Common (30)
  common: 'Search, Filter, Settings, Sliders, User, Users, UserPlus, UserMinus, Calendar, Clock, Bell, BellOff, Star, Heart, ThumbsUp, ThumbsDown, Eye, EyeOff, Lock, Unlock, Key, Shield, ShieldAlert, Info, HelpCircle, AlertCircle, AlertTriangle, CheckCircle, XCircle, Loader',

  // Communication (25)
  communication: 'Mail, MessageCircle, MessageSquare, Send, Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, Video, VideoOff, Mic, MicOff, AtSign, Hash, Inbox, Archive, Paperclip, Link, Link2, Bookmark, Flag, Tag, Rss, Radio, Podcast',

  // Media (25)
  media: 'Image, Images, Film, Video, Music, Headphones, Volume, Volume1, Volume2, VolumeX, Play, Pause, Square, Circle, StopCircle, PlayCircle, Camera, CameraOff, Aperture, Disc, FileVideo, FileAudio, FileImage, Folder, FolderOpen',

  // Files & Folders (20)
  files: 'File, FileText, FilePlus, FileMinus, FileEdit, FileCheck, FileX, FolderPlus, FolderMinus, FolderEdit, FolderCheck, FolderX, Archive, Package, Package2, PackageOpen, PackageCheck, PackageX, PackagePlus, PackageMinus',

  // Status & Alerts (20)
  status: 'Check, CheckCircle, CheckCircle2, CheckSquare, XCircle, XSquare, AlertCircle, AlertTriangle, AlertOctagon, Info, HelpCircle, QuestionMarkCircle, Ban, ShieldAlert, ShieldCheck, ShieldOff, Verified, Award, BadgeCheck, BadgeAlert',

  // Commerce & Business (20)
  commerce: 'ShoppingCart, ShoppingBag, CreditCard, DollarSign, TrendingUp, TrendingDown, BarChart, BarChart2, BarChart3, PieChart, Activity, TrendingUp, Percent, Receipt, Wallet, Coins, Banknote, HandCoins, Calculator, Scale',

  // Development & Code (20)
  development: 'Code, Code2, Terminal, Command, GitBranch, GitCommit, GitMerge, GitPullRequest, Github, Database, Server, Cloud, CloudOff, Cpu, HardDrive, Wifi, WifiOff, Bluetooth, BluetoothOff, Bug',

  // Design & Creative (15)
  design: 'Palette, Pipette, Paintbrush, Pen, PenTool, Droplet, Sparkles, Wand, Wand2, Type, Bold, Italic, Underline, AlignLeft, AlignCenter',

  // Maps & Location (15)
  maps: 'Map, MapPin, Navigation, Navigation2, Compass, Globe, Globe2, Locate, LocateFixed, LocateOff, Target, Crosshair, Route, MapPinned, Signpost',

  // Weather & Nature (10)
  weather: 'Sun, Moon, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, Wind, Sunrise, Sunset',

  // Time & Calendar (10)
  time: 'Calendar, CalendarDays, CalendarCheck, CalendarX, CalendarPlus, Clock, Timer, Hourglass, Watch, AlarmClock',

  // Layout & Structure (10)
  layout: 'Layout, LayoutGrid, LayoutList, LayoutDashboard, Square, Circle, Triangle, Hexagon, Octagon, Pentagon',

  // Transportation (10)
  transport: 'Car, Truck, Bus, Train, Plane, Bike, Ship, Rocket, Zap, Gauge'
};

/**
 * Heroicons - 250+ icons
 * Tailwind CSS official icon set
 */
export const HEROICONS = {
  // Actions (30)
  actions: 'PlusIcon, MinusIcon, PencilIcon, PencilSquareIcon, TrashIcon, ArchiveBoxIcon, DocumentDuplicateIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ShareIcon, PaperAirplaneIcon, EllipsisHorizontalIcon, EllipsisVerticalIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowPathIcon, ArrowPathRoundedSquareIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, ClipboardIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon, ClipboardDocumentListIcon, ScissorsIcon, PaperClipIcon, LinkIcon, ArrowTopRightOnSquareIcon, CursorArrowRaysIcon',

  // Navigation (30)
  navigation: 'ChevronRightIcon, ChevronLeftIcon, ChevronUpIcon, ChevronDownIcon, ChevronDoubleRightIcon, ChevronDoubleLeftIcon, ChevronDoubleUpIcon, ChevronDoubleDownIcon, ArrowRightIcon, ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon, ArrowLongRightIcon, ArrowLongLeftIcon, ArrowLongUpIcon, ArrowLongDownIcon, Bars3Icon, XMarkIcon, HomeIcon, RectangleStackIcon, Squares2X2Icon, ListBulletIcon, TableCellsIcon, QueueListIcon, ViewColumnsIcon, BackwardIcon, ForwardIcon, PlayIcon, PauseIcon, StopIcon',

  // UI/Common (30)
  common: 'MagnifyingGlassIcon, AdjustmentsHorizontalIcon, Cog6ToothIcon, Cog8ToothIcon, UserIcon, UsersIcon, UserPlusIcon, UserMinusIcon, CalendarIcon, ClockIcon, BellIcon, BellAlertIcon, BellSlashIcon, StarIcon, HeartIcon, HandThumbUpIcon, HandThumbDownIcon, EyeIcon, EyeSlashIcon, LockClosedIcon, LockOpenIcon, KeyIcon, ShieldCheckIcon, ShieldExclamationIcon, InformationCircleIcon, QuestionMarkCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon',

  // Communication (25)
  communication: 'EnvelopeIcon, EnvelopeOpenIcon, ChatBubbleLeftIcon, ChatBubbleLeftRightIcon, ChatBubbleOvalLeftIcon, ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon, PhoneIcon, PhoneArrowDownLeftIcon, PhoneArrowUpRightIcon, PhoneXMarkIcon, VideoCameraIcon, VideoCameraSlashIcon, MicrophoneIcon, SpeakerWaveIcon, SpeakerXMarkIcon, AtSymbolIcon, HashtagIcon, InboxIcon, InboxArrowDownIcon, InboxStackIcon, ArchiveBoxIcon, BookmarkIcon, FlagIcon, RssIcon',

  // Media (25)
  media: 'PhotoIcon, CameraIcon, FilmIcon, MusicalNoteIcon, SpeakerWaveIcon, SpeakerXMarkIcon, PlayIcon, PlayCircleIcon, PlayPauseIcon, PauseIcon, PauseCircleIcon, StopIcon, StopCircleIcon, ForwardIcon, BackwardIcon, SpeakerWaveIcon, VideoCameraIcon, CameraIcon, FilmIcon, MusicalNoteIcon, DocumentIcon, FolderIcon, FolderOpenIcon, DocumentTextIcon, PhotoIcon',

  // Files & Folders (20)
  files: 'DocumentIcon, DocumentTextIcon, DocumentPlusIcon, DocumentMinusIcon, DocumentCheckIcon, DocumentMagnifyingGlassIcon, DocumentArrowDownIcon, DocumentArrowUpIcon, FolderIcon, FolderOpenIcon, FolderPlusIcon, FolderMinusIcon, ArchiveBoxIcon, ArchiveBoxArrowDownIcon, ArchiveBoxXMarkIcon, InboxIcon, InboxStackIcon, PaperClipIcon, ClipboardIcon, ClipboardDocumentIcon',

  // Status & Alerts (20)
  status: 'CheckIcon, CheckCircleIcon, CheckBadgeIcon, XMarkIcon, XCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, QuestionMarkCircleIcon, NoSymbolIcon, ShieldCheckIcon, ShieldExclamationIcon, BellAlertIcon, BellSnoozeIcon, BellSlashIcon, BoltIcon, BoltSlashIcon, FireIcon, SparklesIcon, SignalIcon',

  // Commerce & Business (20)
  commerce: 'ShoppingCartIcon, ShoppingBagIcon, CreditCardIcon, BanknotesIcon, CurrencyDollarIcon, ChartBarIcon, ChartPieIcon, PresentationChartBarIcon, PresentationChartLineIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon, CalculatorIcon, ReceiptPercentIcon, ReceiptRefundIcon, TagIcon, TicketIcon, GiftIcon, TrophyIcon, BuildingStorefrontIcon',

  // Development & Code (20)
  development: 'CodeBracketIcon, CodeBracketSquareIcon, CommandLineIcon, CpuChipIcon, ServerIcon, ServerStackIcon, CircleStackIcon, CloudIcon, CloudArrowUpIcon, CloudArrowDownIcon, WifiIcon, SignalIcon, SignalSlashIcon, ComputerDesktopIcon, DevicePhoneMobileIcon, DeviceTabletIcon, CubeIcon, CubeTransparentIcon, WindowIcon, BugAntIcon',

  // Design & Creative (15)
  design: 'PaintBrushIcon, SwatchIcon, EyeDropperIcon, SparklesIcon, BeakerIcon, LightBulbIcon, SunIcon, MoonIcon, BoltIcon, FireIcon, CursorArrowRippleIcon, CursorArrowRaysIcon, SquaresPlusIcon, Squares2X2Icon, RectangleGroupIcon',

  // Maps & Location (15)
  maps: 'MapIcon, MapPinIcon, GlobeAltIcon, GlobeAmericasIcon, GlobeAsiaAustraliaIcon, GlobeEuropeAfricaIcon, BuildingOfficeIcon, BuildingOffice2Icon, BuildingLibraryIcon, BuildingStorefrontIcon, HomeIcon, HomeModernIcon, TruckIcon, RocketLaunchIcon, PaperAirplaneIcon',

  // Weather & Nature (10)
  weather: 'SunIcon, MoonIcon, CloudIcon, BoltIcon, FireIcon, BeakerIcon, SparklesIcon, StarIcon, GlobeAltIcon, AcademicCapIcon',

  // Time & Calendar (10)
  time: 'CalendarIcon, CalendarDaysIcon, ClockIcon, BellIcon, BellAlertIcon, BellSnoozeIcon, ArrowPathIcon, ArrowPathRoundedSquareIcon, StopIcon, PlayIcon',

  // Layout & Structure (10)
  layout: 'Squares2X2Icon, SquaresPlusIcon, Square2StackIcon, Square3Stack3DIcon, RectangleGroupIcon, RectangleStackIcon, TableCellsIcon, ViewColumnsIcon, QueueListIcon, Bars3Icon',

  // Transportation (10)
  transport: 'TruckIcon, RocketLaunchIcon, PaperAirplaneIcon, GlobeAltIcon, MapIcon, BuildingStorefrontIcon, HomeIcon, BuildingOfficeIcon, CpuChipIcon, ServerIcon'
};

/**
 * Material Icons - 250+ icons
 * Google Material Design icons
 */
export const MATERIAL_ICONS = {
  // Actions (30)
  actions: 'Add, Remove, Edit, Delete, ContentCopy, ContentCut, ContentPaste, Save, Download, Upload, Share, Send, MoreHoriz, MoreVert, OpenWith, ZoomIn, ZoomOut, Fullscreen, FullscreenExit, Refresh, Undo, Redo, Reply, ReplyAll, Forward, SelectAll, DriveFileMove, Restore, RestoreFromTrash, Link',

  // Navigation (30)
  navigation: 'ChevronRight, ChevronLeft, ArrowForward, ArrowBack, ArrowUpward, ArrowDownward, ExpandMore, ExpandLess, KeyboardArrowRight, KeyboardArrowLeft, KeyboardArrowUp, KeyboardArrowDown, Menu, Close, Home, Dashboard, ViewList, ViewModule, ViewQuilt, GridView, Apps, MoreHoriz, MoreVert, FirstPage, LastPage, NavigateBefore, NavigateNext, Refresh, SubdirectoryArrowRight, Launch',

  // UI/Common (30)
  common: 'Search, FilterList, Settings, Tune, AccountCircle, Group, PersonAdd, PersonRemove, CalendarToday, AccessTime, Notifications, NotificationsActive, NotificationsOff, Star, StarBorder, StarHalf, Favorite, FavoriteBorder, ThumbUp, ThumbDown, Visibility, VisibilityOff, Lock, LockOpen, VpnKey, Security, Info, Help, Error, Warning, CheckCircle',

  // Communication (25)
  communication: 'Email, MailOutline, Message, Chat, ChatBubble, Phone, Call, Voicemail, Videocam, VideoCall, MissedVideoCall, Mic, MicOff, VolumeUp, VolumeOff, AlternateEmail, Tag, Inbox, Drafts, Send, Archive, Unarchive, Bookmark, BookmarkBorder, Flag',

  // Media (25)
  media: 'Image, Collections, Photo, PhotoCamera, Videocam, Movie, MusicNote, Album, Equalizer, VolumeUp, VolumeMute, PlayArrow, PlayCircle, Pause, PauseCircle, Stop, StopCircle, SkipNext, SkipPrevious, FastForward, FastRewind, Replay, Shuffle, Repeat, QueueMusic',

  // Files & Folders (20)
  files: 'InsertDriveFile, Description, FileCopy, Folder, FolderOpen, CreateNewFolder, FolderShared, FolderSpecial, CloudUpload, CloudDownload, CloudDone, CloudOff, AttachFile, Attachment, UploadFile, DownloadForOffline, DriveFileMove, DriveFileRenameOutline, FileCopy, FilePresent',

  // Status & Alerts (20)
  status: 'Check, CheckCircle, CheckCircleOutline, Cancel, CancelOutlined, Error, ErrorOutline, Warning, WarningAmber, Info, InfoOutlined, HelpOutline, Verified, VerifiedUser, Dangerous, Block, ReportProblem, NotificationImportant, PriorityHigh, NewReleases',

  // Commerce & Business (20)
  commerce: 'ShoppingCart, ShoppingBag, ShoppingBasket, AddShoppingCart, RemoveShoppingCart, Payment, CreditCard, Receipt, LocalOffer, Sell, AttachMoney, Money, TrendingUp, TrendingDown, ShowChart, BarChart, PieChart, Assessment, AccountBalance, Storefront',

  // Development & Code (20)
  development: 'Code, Terminal, DataObject, Storage, CloudQueue, Cloud, Computer, Memory, DeveloperMode, BugReport, Build, Settings, Api, IntegrationInstructions, JavaScript, GitHub, GitHub, Terminal, Webhook, Token',

  // Design & Creative (15)
  design: 'Palette, ColorLens, Brush, Create, Edit, Draw, FormatPaint, FormatSize, FormatBold, FormatItalic, FormatUnderlined, FormatColorText, FormatColorFill, AutoAwesome, Gradient',

  // Maps & Location (15)
  maps: 'Map, Place, LocationOn, LocationOff, MyLocation, Explore, NearMe, Navigation, Directions, DirectionsCar, DirectionsWalk, DirectionsTransit, Public, Language, TravelExplore',

  // Weather & Nature (10)
  weather: 'WbSunny, NightsStay, Cloud, CloudQueue, WbCloudy, Thunderstorm, AcUnit, Opacity, Air, FilterDrama',

  // Time & Calendar (10)
  time: 'CalendarToday, CalendarMonth, EventNote, EventAvailable, EventBusy, Schedule, AccessTime, Timer, TimerOff, Alarm',

  // Layout & Structure (10)
  layout: 'Dashboard, GridView, ViewList, ViewModule, ViewQuilt, ViewAgenda, ViewColumn, ViewStream, Apps, TableChart',

  // Transportation (10)
  transport: 'DirectionsCar, DirectionsBus, DirectionsTransit, DirectionsSubway, DirectionsRailway, DirectionsBike, DirectionsWalk, Flight, LocalShipping, TwoWheeler'
};

/**
 * Get all icons for a specific library as a formatted string
 */
export function getIconsForLibrary(library: 'lucide' | 'heroicons' | 'materialIcons'): string {
  const icons = library === 'lucide' ? LUCIDE_ICONS : library === 'heroicons' ? HEROICONS : MATERIAL_ICONS;

  return Object.entries(icons)
    .map(([category, iconList]) => `${category.toUpperCase()}: ${iconList}`)
    .join('\n');
}

/**
 * Get icon count for a library
 */
export function getIconCount(library: 'lucide' | 'heroicons' | 'materialIcons'): number {
  const icons = library === 'lucide' ? LUCIDE_ICONS : library === 'heroicons' ? HEROICONS : MATERIAL_ICONS;

  return Object.values(icons).reduce((total, iconList) => {
    return total + iconList.split(', ').length;
  }, 0);
}