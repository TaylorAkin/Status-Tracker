'use client';

import { credit } from '@/lib/engine';
import { fmt } from '@/lib/format';
import { HEADSTART_METHOD } from '@/lib/tracker/methods';
import { buttonClass, EmptyState, Hint, InnerCard, inputClass, labelClass, Panel, PanelHead, StatePill, Switch } from '@/components/ui';
import * as actions from '../actions';
import { InfoTip } from './help/info-tip';
import { useTracker } from './tracker-context';

export function HeadstartsSection() {
  const { data, unit, run, setState, setDate, openEntry, setSettingsOpen, toast } = useTracker();
  const { statusYear } = data.tracker;
  const cards = data.trackerCards
    .map((tc) => ({ tc, card: data.cards.find((c) => c.key === tc.cardKey)! }))
    .filter(({ card }) => card?.headstartAmount);
  const total = cards
    .filter(({ tc }) => tc.included)
    .reduce((sum, { tc }) => {
      const e = data.entries.find((x) => x.cardKey === tc.cardKey && x.method === HEADSTART_METHOD);
      return sum + (e && e.state !== 'Cancelled' ? credit(e) : 0);
    }, 0);

  return (
    <Panel data-help="headstarts">
      <PanelHead
        title={
          <>
            Card Headstarts
            <InfoTip id="headstarts" />
          </>
        }
        sub={
          cards.length
            ? `Your cards contribute ${fmt(total)} forecast ${unit}. Mark each as credited only when it posts.`
            : 'Eligible Delta cards add an annual MQD Headstart.'
        }
      >
        <button className={buttonClass.secondary} onClick={() => setSettingsOpen(true)}>
          Manage cards
        </button>
      </PanelHead>

      {cards.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map(({ tc, card }) => {
            const e = data.entries.find((x) => x.cardKey === card.key && x.method === HEADSTART_METHOD);
            const excluded = !tc.included;
            return (
              <InnerCard key={card.key} muted={excluded}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[13px] font-semibold leading-snug text-brand">{card.name}</h3>
                  {e ? <StatePill state={excluded ? 'Cancelled' : e.state}>{excluded ? 'Not added' : undefined}</StatePill> : null}
                </div>
                <p className="mt-2 text-[11px] text-muted">{tc.potential ? 'Considering · Annual MQD Headstart' : 'Annual MQD Headstart'}</p>
                <strong className="my-3 block text-[28px] text-brand">
                  {fmt(e ? credit(e) : card.headstartAmount!)} <small className="text-[13px] font-normal">{unit}</small>
                </strong>
                <div className="flex flex-col items-start gap-3">
                  {tc.potential && (
                    <Switch
                      label="Include this card in forecast"
                      checked={tc.included}
                      onChange={(on) =>
                        run(
                          { type: 'cardIncluded', cardKey: card.key, included: on },
                          () => actions.setCardIncluded(card.key, on),
                          on ? 'Card included in your forecast.' : 'Card excluded from your forecast.',
                        )
                      }
                    />
                  )}
                  {e && (
                    <Switch
                      label="Credited to account"
                      checked={e.state === 'Posted'}
                      disabled={excluded}
                      onChange={(on) =>
                        setState(e.id, on ? 'Posted' : 'Planned', on ? 'Headstart moved to Posted.' : 'Headstart returned to Planned.')
                      }
                    />
                  )}
                </div>
                {e && (
                  <>
                    <label htmlFor={`hs-date-${card.key}`} className={`${labelClass} mt-4`}>
                      {e.state === 'Posted' ? 'Qualifying credit date' : 'Expected credit date'}
                    </label>
                    <input
                      id={`hs-date-${card.key}`}
                      type="date"
                      min={`${statusYear}-01-01`}
                      max={`${statusYear}-12-31`}
                      defaultValue={e.date}
                      key={e.date}
                      className={inputClass}
                      onBlur={(ev) => {
                        const v = ev.target.value;
                        if (v === e.date) return;
                        if (!v || !ev.target.checkValidity()) {
                          toast(`Use a date within ${statusYear}.`);
                          ev.target.value = e.date;
                          return;
                        }
                        setDate(e.id, v);
                      }}
                    />
                    <Hint>
                      {excluded
                        ? 'Excluded until you include this card.'
                        : e.state === 'Posted'
                          ? 'Counts toward posted MQDs.'
                          : 'Counts toward your forecast only.'}
                    </Hint>
                    <button className={`${buttonClass.link} mt-3`} onClick={() => openEntry(e.id)}>
                      Edit amount / details
                    </button>
                  </>
                )}
              </InnerCard>
            );
          })}
        </div>
      ) : (
        <EmptyState>
          No Delta cards selected yet.{' '}
          <button className={buttonClass.link} onClick={() => setSettingsOpen(true)}>
            Choose the cards you hold
          </button>{' '}
          to add their Headstarts and monthly spend.
        </EmptyState>
      )}
    </Panel>
  );
}
