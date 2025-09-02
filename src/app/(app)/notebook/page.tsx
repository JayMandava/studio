import { NotebookView } from './notebook-view';

export default function NotebookPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Notebook
        </h1>
        <p className="text-muted-foreground">
          A history of your generated test cases.
        </p>
      </div>
      <NotebookView />
    </div>
  );
}
