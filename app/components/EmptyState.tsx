type EmptyStateProps = {
  title?: string;
  description?: string;
};

export default function EmptyState({
  title = "No executive signals available",
  description = "There are currently no Kill, Fix, or Scale signals to display.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-gray-700 rounded-lg p-10 text-center text-gray-400">
      <p className="font-semibold mb-2">{title}</p>
      <p className="text-sm max-w-md">{description}</p>
    </div>
  );
}
