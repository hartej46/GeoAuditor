/**
 * DataNotice — Shows data availability badges and demo mode status in Sahara design.
 */
export default function DataNotice({ demoMode, dataAvailability }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
      {demoMode && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-fixed)',
            color: 'var(--on-primary-fixed)',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          <span>🎭</span>
          <span>Demo Mode — using verified fixture data</span>
        </div>
      )}
      <DataBadge label="Google AI Overview" available={dataAvailability?.aiOverview} />
      <DataBadge label="Google AI Mode" available={dataAvailability?.aiMode} />
    </div>
  );
}

function DataBadge({ label, available }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: available ? 'var(--surface-container)' : 'var(--surface-container-low)',
        color: available ? 'var(--on-surface)' : 'var(--outline)',
        border: '1px solid var(--outline-variant)',
        fontSize: '12px',
      }}
    >
      <span>{available ? '✓' : '○'}</span>
      <span>{label}: {available ? 'Active' : 'Not triggered'}</span>
    </div>
  );
}
