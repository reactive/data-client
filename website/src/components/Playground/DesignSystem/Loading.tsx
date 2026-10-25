/** A page while it loads: its title and a paragraph drawn as skeletons
 * (base.css), standing where the content will land */
export function Loading() {
  return (
    <div className="skeletonPage" role="status" aria-label="Loading">
      <span className="skeleton" />
      <span className="skeleton" />
      <span className="skeleton" />
      <span className="skeleton" />
    </div>
  );
}
