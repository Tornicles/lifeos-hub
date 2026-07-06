import { CrossModuleAnalytics } from '@/components/dashboard/CrossModuleAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Deep insights into your LifeOS performance and correlations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <CrossModuleAnalytics />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Correlations</CardTitle>
            <CardDescription>
              How different life areas affect each other
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Sleep → Productivity</span>
                <span className="font-semibold text-green-600">+0.82</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Exercise → Mood</span>
                <span className="font-semibold text-green-600">+0.76</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Social → Emotional</span>
                <span className="font-semibold text-green-600">+0.68</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Stress → Health</span>
                <span className="font-semibold text-red-600">-0.54</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Predictive Insights</CardTitle>
            <CardDescription>
              AI-powered forecasting based on your patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Based on your current trajectory, your Ultra Score is predicted to reach{' '}
                <span className="font-semibold text-green-600">82</span> by the end of the month.
              </p>
              <p className="text-muted-foreground">
                Your strongest improvement area is{' '}
                <span className="font-semibold">Career Master</span>, showing a{' '}
                <span className="text-green-600">+15%</span> trend.
              </p>
              <p className="text-muted-foreground">
                Consider focusing on{' '}
                <span className="font-semibold">Spirituality</span> this week for balanced growth.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
