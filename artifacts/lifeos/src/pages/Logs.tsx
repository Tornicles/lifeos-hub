import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListLogs, useListHubs } from "@workspace/api-client-react";
import { Plus, Search, Download, Filter, FileText } from "lucide-react";

export default function Logs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const { data: logs, isLoading } = useListLogs({
    // Filter by source if possible, but listLogs doesn't have source param in spec
  });
  
  const { data: hubs } = useListHubs();

  const filteredLogs = logs?.filter(log => {
    const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
    if (!matchesSource) return false;
    
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.metric?.toLowerCase().includes(search) ||
      log.notes?.toLowerCase().includes(search) ||
      log.source?.toLowerCase().includes(search)
    );
  });

  const sourceOptions = [
    'all',
    'Ultra_Log',
    'Finance_Log',
    'Health_Log',
    'Work_Log',
    'Academy_Log',
    'PersonalDev_Log',
    'Household_Log',
    'Relationships_Log',
    'Projects_Log',
    'Mindset_Log',
  ];

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'Ultra_Log': 'bg-purple-100 text-purple-700',
      'Finance_Log': 'bg-green-100 text-green-700',
      'Health_Log': 'bg-red-100 text-red-700',
      'Work_Log': 'bg-blue-100 text-blue-700',
      'Academy_Log': 'bg-yellow-100 text-yellow-700',
      'PersonalDev_Log': 'bg-indigo-100 text-indigo-700',
      'Household_Log': 'bg-orange-100 text-orange-700',
      'Relationships_Log': 'bg-pink-100 text-pink-700',
      'Projects_Log': 'bg-cyan-100 text-cyan-700',
      'Mindset_Log': 'bg-violet-100 text-violet-700',
    };
    return colors[source] || 'bg-gray-100 text-gray-700';
  };

  // Get week dates for stats
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Logs & Data</h1>
          <p className="text-muted-foreground text-lg">
            Universal activity feed from all hubs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Log
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source === 'all' ? 'All Sources' : source.replace('_Log', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredLogs?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {filteredLogs?.filter(l => {
                const logDate = new Date(l.logDate);
                return logDate >= weekStart && logDate <= weekEnd;
              }).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {filteredLogs?.filter(l => l.logDate === new Date().toISOString().split('T')[0]).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Most Active Hub</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {logs && logs.length > 0 && hubs
                ? Object.entries(
                    logs.reduce((acc, l) => {
                      const hub = hubs.find(h => h.id === l.hubId)?.name || 'Unknown';
                      acc[hub] = (acc[hub] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).sort((a, b) => b[1] - a[1])[0]?.[0] || '--'
                : '--'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filteredLogs && filteredLogs.length > 0 ? (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const hub = hubs?.find(h => h.id === log.hubId);
            return (
            <Card key={log.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSourceColor(log.source || '')}>
                        {(log.source || '').replace('_Log', '')}
                      </Badge>
                      {hub && (
                        <Badge variant="outline">{hub.name}</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.logDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {log.metric && (
                        <h3 className="font-semibold text-lg">{log.metric}</h3>
                      )}
                      {log.notes && (
                        <p className="text-muted-foreground">{log.notes}</p>
                      )}
                    </div>
                  </div>

                  {log.value !== null && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {log.value}
                      </div>
                      <div className="text-xs text-muted-foreground">value</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );})}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No logs found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || sourceFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start logging your activities to track your progress'}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Log
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
