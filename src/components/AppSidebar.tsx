import { 
  LayoutDashboard, 
  Target, 
  DollarSign, 
  Heart, 
  Briefcase, 
  GraduationCap,
  Sprout,
  Home,
  Users,
  FolderKanban,
  Brain,
  Calendar,
  CheckSquare,
  FileText,
  BarChart3,
  Zap,
  Settings,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const mainItems = [
  { title: "Command Center", url: "/dashboard", icon: LayoutDashboard },
  { title: "Ultra Hub", url: "/ultra", icon: Target },
];

const hubItems = [
  { title: "Finance", url: "/hubs/finance", icon: DollarSign },
  { title: "Health", url: "/hubs/health", icon: Heart },
  { title: "Work", url: "/hubs/work", icon: Briefcase },
  { title: "Academy", url: "/hubs/academy", icon: GraduationCap },
  { title: "Personal Dev", url: "/hubs/personal-dev", icon: Sprout },
  { title: "Household", url: "/hubs/household", icon: Home },
  { title: "Relationships", url: "/hubs/relationships", icon: Users },
  { title: "Projects Hub", url: "/hubs/projects", icon: FolderKanban },
  { title: "Mindset", url: "/hubs/mindset", icon: Brain },
];

const toolItems = [
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Habits", url: "/habits", icon: CheckSquare },
  { title: "Logs", url: "/logs", icon: FileText },
];

const systemItems = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Automation", url: "/automation", icon: Zap },
  { title: "Insights", url: "/insights", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          {open && (
            <div>
              <h2 className="font-bold text-lg">LifeOS</h2>
              <p className="text-xs text-muted-foreground">Ultra v30</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Life Hubs */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Life Hubs
            {open && <ChevronRight className="h-4 w-4 ml-auto" />}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {hubItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-accent/10 text-accent font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-secondary/50 text-secondary-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System */}
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-muted text-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        {open && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Pro
            </Badge>
            <span className="text-xs text-muted-foreground">v30.0</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
