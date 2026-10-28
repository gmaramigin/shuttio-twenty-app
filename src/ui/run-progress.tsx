import { AppPath, navigate } from 'twenty-sdk/front-component';
import { MainButton } from 'twenty-ui/components/input';
import { IconExternalLink } from 'twenty-ui/icon';
import { ProgressBar } from 'twenty-ui/primitives/feedback';
import { Text } from 'twenty-ui/primitives/typography';
import { useTheme } from 'twenty-ui/theme';

import type { MigrationDetail } from 'src/shuttio-api/contract';
import { recordInTwenty } from 'src/ui/flow';

const percent = (done: number, failed: number, total: number | null) =>
  total && total > 0 ? Math.min(100, Math.round(((done + failed) / total) * 100)) : 0;

const count = (value: number) => value.toLocaleString('en-US');


export const RunProgress = ({ detail }: { detail: MigrationDetail }) => {
  const theme = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing['4'] }}>
      {detail.objects.length === 0 && <Text>Waiting for the first object to start…</Text>}
      {detail.objects.map((object) => (
        <div key={object.name} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing['1'] }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: theme.spacing['2'],
            }}
          >
            <Text>{object.label}</Text>
            <Text style={{ color: theme.font.color.tertiary }}>
              {count(object.done)}
              {object.total !== null ? ` of ${count(object.total)}` : ''}
              {object.failed > 0 ? ` · ${count(object.failed)} failed` : ''}
            </Text>
          </div>
          <ProgressBar
            aria-label={`${object.label} progress`}
            value={percent(object.done, object.failed, object.total)}
            backgroundColor={theme.background.tertiary}
            withBorderRadius
          />
        </div>
      ))}

      {detail.error && <Text style={{ color: theme.font.color.danger }}>{detail.error}</Text>}

      {detail.warnings && detail.warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing['1'] }}>
          <Text style={{ fontWeight: theme.font.weight.medium }}>Worth checking</Text>
          {detail.warnings.slice(0, 8).map((warning) => (
            <Text key={warning} style={{ color: theme.font.color.secondary }}>
              {warning}
            </Text>
          ))}
        </div>
      )}

      {detail.skippedLinks && detail.skippedLinks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing['1'] }}>
          <Text style={{ fontWeight: theme.font.weight.medium }}>Imported without some links</Text>
          {detail.skippedLinks.slice(0, 8).map((line) => (
            <Text key={line} style={{ color: theme.font.color.secondary }}>
              {line}
            </Text>
          ))}
        </div>
      )}

      {detail.errors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing['1'] }}>
          <Text style={{ fontWeight: theme.font.weight.medium }}>Records that did not import</Text>
          {detail.errors.slice(0, 8).map((error, index) => (
            <Text key={`${error.object}-${index}`} style={{ color: theme.font.color.secondary }}>
              {error.object}: {error.message} ({count(error.count)})
            </Text>
          ))}
        </div>
      )}

      {(detail.links.length > 0 || detail.resultsUrl) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing['2'] }}>
          {detail.links.slice(0, 6).map((link) => {
            // A record of this workspace opens here, not in a new tab.
            const inTwenty = recordInTwenty(link.url);
            return inTwenty ? (
              <MainButton
                key={link.url}
                variant="outline"
                size="sm"
                onClick={() =>
                  void navigate(AppPath.RecordShowPage, {
                    objectNameSingular: inTwenty.object,
                    objectRecordId: inTwenty.id,
                  })
                }
              >
                {link.label}
              </MainButton>
            ) : (
              <MainButton
                key={link.url}
                variant="outline"
                size="sm"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<IconExternalLink size={14} />}
              >
                {link.label}
              </MainButton>
            );
          })}
          {detail.resultsUrl && (
            <MainButton
              variant="ghost"
              size="sm"
              href={detail.resultsUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<IconExternalLink size={14} />}
            >
              Full report on shuttio.com
            </MainButton>
          )}
        </div>
      )}
    </div>
  );
};
