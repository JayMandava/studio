
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import CircularProgress from "@mui/material/CircularProgress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SaveIcon from "@mui/icons-material/Save";
import DnsIcon from "@mui/icons-material/Dns";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PowerIcon from "@mui/icons-material/PowerSettingsNew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Switch } from '@/components/ui/switch';

const ALMTools = ['Jira', 'Polarion', 'Azure DevOps', 'ALM'] as const;
type ALMTool = typeof ALMTools[number];

const integrationSchema = z.object({
    tool: z.enum(ALMTools),
    url: z.string().refine((val) => !val || z.string().url().safeParse(val).success, {
        message: 'Please enter a valid URL or leave empty.',
    }),
    username: z.string(),
    apiToken: z.string(),
    projectKey: z.string().optional(),
    isActive: z.boolean().default(false),
});

const formSchema = z.object({
  integrations: z.array(integrationSchema),
});

type IntegrationFormValues = z.infer<typeof formSchema>;

const IntegrationCard = ({
  tool,
  form,
  onSave,
}: {
  tool: ALMTool;
  form: any;
  onSave: () => void;
}) => {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const { fields } = useFieldArray({
    control: form.control,
    name: 'integrations',
    keyName: 'key',
  });

  const toolIndex = fields.findIndex((field: any) => field.tool === tool);
  const currentConfig = toolIndex > -1 ? fields[toolIndex] : null;

  const handleActiveToggle = (checked: boolean) => {
    const currentValues = form.getValues(`integrations.${toolIndex}`);
    form.setValue(`integrations.${toolIndex}`, {...currentValues, isActive: checked });

    // Deactivate all other integrations
    fields.forEach((field: any, index: number) => {
        if(field.tool !== tool) {
             const otherValues = form.getValues(`integrations.${index}`);
             form.setValue(`integrations.${index}`, {...otherValues, isActive: false });
        }
    });

    // Save to localStorage (silently)
    onSave(true);
  };

  const handleTestConnection = async () => {
    if (!currentConfig) return;

    const values = form.getValues(`integrations.${toolIndex}`);

    // Validate required fields
    if (!values.url || !values.username || !values.apiToken) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields before testing.',
      });
      return;
    }

    if (tool === 'Jira' && !values.projectKey) {
      toast({
        variant: 'destructive',
        title: 'Project Key Required',
        description: 'Please enter your JIRA project key before testing.',
      });
      return;
    }

    setIsTesting(true);

    try {
      // Test JIRA connection
      if (tool === 'Jira') {
        const response = await fetch('/api/jira/test-connection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: values.url,
            username: values.username,
            apiToken: values.apiToken,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast({
            title: 'Connection Successful',
            description: `Connected to JIRA as ${data.user.displayName || values.username}`,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Connection Failed',
            description: data.error || 'Please check your credentials.',
          });
        }
      } else {
        // Placeholder for other tools
        toast({
          title: 'Test Connection',
          description: `Connection testing for ${tool} is coming soon.`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to connect to the server.',
      });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <DnsIcon className="h-6 w-6" />
             <CardTitle>{tool}</CardTitle>
          </div>
          {currentConfig && currentConfig.isActive ? (
             <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
             <CheckCircleIcon className="h-4 w-4" />
                <span>Active</span>
             </div>
          ) : (
             <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
             <WarningAmberIcon className="h-4 w-4" />
                <span>Inactive</span>
             </div>
          )}
        </div>
        <CardDescription>
          Configure the connection to your {tool} instance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name={`integrations.${toolIndex}.url`}
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>Instance URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://your-instance.com"
                  {...field}
                  value={field.value || ''}
                  onBlur={(e) => {
                    field.onBlur();
                    onSave();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`integrations.${toolIndex}.username`}
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="your.username"
                  {...field}
                  value={field.value || ''}
                  onBlur={(e) => {
                    field.onBlur();
                    onSave();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`integrations.${toolIndex}.apiToken`}
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>API Token / Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  {...field}
                  value={field.value || ''}
                  onBlur={(e) => {
                    field.onBlur();
                    onSave();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {tool === 'Jira' && (
          <FormField
            control={form.control}
            name={`integrations.${toolIndex}.projectKey`}
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel>Project Key (Required for JIRA)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="PROJ"
                    {...field}
                    value={field.value || ''}
                    onBlur={(e) => {
                      field.onBlur();
                      onSave();
                    }}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Find this in your JIRA URL: https://yourinstance.atlassian.net/browse/<strong>PROJ</strong>-123
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={!currentConfig || isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <>
                    <CircularProgress size={16} className="mr-2 text-primary" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
             <div className="space-y-0.5">
                <FormLabel>Set as Active Connection</FormLabel>
                <p className="text-xs text-muted-foreground">
                    Only one integration can be active at a time.
                </p>
             </div>
              <FormField
                control={form.control}
                name={`integrations.${toolIndex}.isActive`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                       <Switch
                         checked={field.value}
                         onCheckedChange={handleActiveToggle}
                         disabled={!currentConfig}
                       />
                    </FormControl>
                  </FormItem>
                )}
              />
        </div>

      </CardContent>
    </Card>
  );
};

export function IntegrationsForm() {
  const { toast } = useToast();

  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      integrations: [],
    },
  });

  useEffect(() => {
    try {
      console.log('Checking localStorage...');
      console.log('All localStorage keys:', Object.keys(localStorage));
      const savedIntegrations = localStorage.getItem('almIntegrations');
      console.log('Loading from localStorage (almIntegrations):', savedIntegrations);

      if (savedIntegrations) {
        const parsed = JSON.parse(savedIntegrations);
        console.log('Parsed integrations:', parsed);

        // Ensure all tools are present in the form state
        const allToolsData = ALMTools.map(tool => {
            const existing = parsed.find((p: any) => p.tool === tool);
            return existing || { tool, url: '', username: '', apiToken: '', projectKey: '', isActive: false };
        });

        console.log('Setting form data:', allToolsData);
        form.reset({ integrations: allToolsData });
      } else {
        console.log('No saved integrations, initializing empty');
        // Initialize with all tools
        form.reset({ integrations: ALMTools.map(tool => ({ tool, url: '', username: '', apiToken: '', projectKey: '', isActive: false })) });
      }
    } catch (e) {
      console.error('Failed to load integrations from localStorage:', e);
    }
  }, []);

  const handleFormSubmit = (data: IntegrationFormValues) => {
    console.log('Form submit triggered with data:', data);
    saveToLocalStorage(false); // Show toast on Save All
  };

  const saveToLocalStorage = (silent = true) => {
    const currentData = form.getValues();
    console.log('Saving to localStorage:', currentData);
    try {
      localStorage.setItem('almIntegrations', JSON.stringify(currentData.integrations));
      console.log('Saved successfully');
      if (!silent) {
        toast({
          title: 'Settings Saved',
          description: 'Your integration settings have been saved.',
        });
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save integration settings.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit, (errors) => {
        console.log('Form validation errors:', errors);
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please check all fields and try again.',
        });
      })} className="space-y-8">
        <Tabs defaultValue="Jira" className="w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="w-full sm:w-auto overflow-x-auto">
              {ALMTools.map(tool => (
                <TabsTrigger key={tool} value={tool} className="text-xs sm:text-sm">
                  {tool}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button type="submit" className="w-full sm:w-auto" onClick={() => {
              console.log('Save All clicked');
              console.log('Current form values:', form.getValues());
              console.log('Form errors:', form.formState.errors);
            }}>
                <SaveIcon className="mr-2 h-4 w-4" fontSize="inherit" />
                Save All
            </Button>
          </div>
          {ALMTools.map(tool => (
            <TabsContent key={tool} value={tool} className="mt-6">
              <IntegrationCard tool={tool} form={form} onSave={() => saveToLocalStorage(true)} />
            </TabsContent>
          ))}
        </Tabs>
      </form>
    </Form>
  );
}
