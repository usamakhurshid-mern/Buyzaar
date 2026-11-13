export default function SiteSkeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading Buyzaar">
      <div className="sk-bar" />
      <div className="sk-hero" />
      <div className="sk-grid">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
