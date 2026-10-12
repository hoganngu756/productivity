/** A miniature browser tab showing exactly the string that is in document.title right now. */
export function TabPreview({ title }: { title: string }) {
  return (
    <div className="tab-preview" aria-label="Browser tab preview">
      <div className="tab-preview__strip">
        <div className="tab-preview__tab">
          <img className="tab-preview__icon" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
          <span className="tab-preview__title" data-testid="tab-preview-title">
            {title}
          </span>
          <span className="tab-preview__close" aria-hidden="true">
            ×
          </span>
        </div>
      </div>
      <div className="tab-preview__page" aria-hidden="true" />
    </div>
  );
}
