import { IntegrationsForm } from "./integrations-form";

export default function IntegrationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Integrations
                </h1>
                <p className="text-muted-foreground">
                    Connect to your Application Lifecycle Management (ALM) tools.
                </p>
            </div>
            <IntegrationsForm />
        </div>
    );
}
