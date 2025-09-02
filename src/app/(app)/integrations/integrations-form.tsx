
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Save, Server, Trash2, Plug, CheckCircle, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const ALMTools = ['Jira', 'Polarion', 'Azure DevOps', 'ALM'] as const;
type ALMTool = typeof ALMTools[number];

const integrationSchema = z.object({
    tool: z.enum(ALMTools),
    url: z.string().url({ message: 'Please enter a valid URL.' }),
    username: z.string().min(1, { message: 'Username is required.' }),
    apiToken: z.string().min(1, { message: 'API Token is required.' }),
    isActive: z.boolean().default(false),
});

const formSchema = z.object({
  integrations: z.array(integrationSchema),
});

type IntegrationFormValues = z.infer<typeof formSchema>;

const IntegrationCard = ({
  tool,
  form,
}: {
  tool: ALMTool;
  form: any;
}) => {
  const { toast } = useToast();
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'integrations',
    keyName: 'key',
  });

  const toolIndex = fields.findIndex((field: any) => field.tool === tool);
  const currentConfig = toolIndex > -1 ? fields[toolIndex] : null;

  const onSubmit = (data: z.infer<typeof integrationSchema>) => {
    if (toolIndex > -1) {
      update(toolIndex, { ...data, tool });
    } else {
      append({ ...data, tool });
    }
    toast({
      title: 'Configuration Saved',
      description: `Your settings for ${tool} have been successfully saved.`,
    });
  };

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

    form.handleSubmit(onSubmit)();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Server className="h-6 w-6" />
             <CardTitle>{tool}</CardTitle>
          </div>
          {currentConfig && currentConfig.isActive ? (
             <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>Active</span>
             </div>
          ) : (
             <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
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
                <Input placeholder="https://your-instance.com" {...field} />
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
                <Input placeholder="your.username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`integrations.${toolIndex}.apiToken`}
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel>API Token / Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
      const savedIntegrations = localStorage.getItem('almIntegrations');
      if (savedIntegrations) {
        const parsed = JSON.parse(savedIntegrations);
        // Ensure all tools are present in the form state
        const allToolsData = ALMTools.map(tool => {
            const existing = parsed.find((p: any) => p.tool === tool);
            return existing || { tool, url: '', username: '', apiToken: '', isActive: false };
        });
        form.reset({ integrations: allToolsData });
      } else {
        // Initialize with all tools
        form.reset({ integrations: ALMTools.map(tool => ({ tool, url: '', username: '', apiToken: '', isActive: false })) });
      }
    } catch (e) {
      console.error('Failed to load integrations from localStorage:', e);
    }
  }, [form]);

  const handleFormSubmit = (data: IntegrationFormValues) => {
    try {
      localStorage.setItem('almIntegrations', JSON.stringify(data.integrations));
      toast({
        title: 'All Configurations Saved',
        description: 'Your settings for all ALM tools have been saved.',
      });
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
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <Tabs defaultValue="Jira" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              {ALMTools.map(tool => (
                <TabsTrigger key={tool} value={tool}>
                  {tool}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save All
            </Button>
          </div>
          {ALMTools.map(tool => (
            <TabsContent key={tool} value={tool} className="mt-6">
              <IntegrationCard tool={tool} form={form} />
            </TabsContent>
          ))}
        </Tabs>
      </form>
    </Form>
  );
}
