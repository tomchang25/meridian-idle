"use client";

import { ACTIONS, getActionDefinition } from "@/game/domain/content/actions";
import { REGIONS } from "@/game/domain/content/regions";
import type { ActionCategory, ActionFilter, GameActionDefinition, GameState } from "@/game/domain/models/game";
import { getActionStatus, getUnmetRequirements } from "@/game/domain/rules/action-selectors";
import { calculateCheckBreakdown } from "@/game/domain/rules/check-resolver";
import { useGameStore } from "@/game/application/use-game-store";
import styles from "./meridian-dashboard.module.css";

const CATEGORY_LABELS: Record<ActionFilter, string> = {
  all: "全部",
  trade: "商業",
  exploration: "探險",
  navigation: "航海",
  combat: "海事",
  expedition: "遠征",
};

const SKILL_LABELS: Record<string, string> = {
  accounting: "會計",
  sailing: "操帆",
  inspection: "檢查",
  gunnery: "炮術",
  negotiation: "社交",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("zh-TW").format(value);
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest.toString().padStart(2, "0")}s`;
}

function formatRemaining(milliseconds: number): string {
  return formatDuration(Math.max(0, Math.ceil(milliseconds / 1000)));
}

function percentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

type ActionCardProps = {
  action: GameActionDefinition;
  state: GameState;
  onStart: (actionId: string) => void;
};

export function ActionCard({ action, state, onStart }: ActionCardProps) {
  const status = getActionStatus(action, state);
  const unmet = getUnmetRequirements(action, state);
  const check = calculateCheckBreakdown(action, state);
  const mastery = state.mastery[action.id] ?? 0;

  return (
    <article className={styles.actionCard} data-status={status} data-testid={`action-${action.id}`}>
      <div className={styles.actionCardHeader}>
        <span className={styles.categoryMark}>{CATEGORY_LABELS[action.category]}</span>
        <span className={styles.actionDuration}>{formatDuration(action.durationSec)}</span>
      </div>
      <h3>{action.name}</h3>
      <p>{action.description}</p>
      <div className={styles.actionMetrics}>
        <span>成功率 {percentage(check.successRate)}</span>
        <span>Mastery {mastery}</span>
      </div>
      {unmet.length > 0 ? (
        <div className={styles.requirements}>
          需要：{unmet.map((requirement) => `${requirement.label} ${requirement.requiredValue}`).join("、")}
        </div>
      ) : (
        <div className={styles.nextNode}>
          {action.nextMasteryNode
            ? `下一節點 Lv.${action.nextMasteryNode.level}：${action.nextMasteryNode.label}`
            : "可持續累積熟練度"}
        </div>
      )}
      <button
        type="button"
        className={styles.actionButton}
        disabled={status !== "available"}
        onClick={() => onStart(action.id)}
      >
        {status === "running" ? "執行中" : status === "locked" ? "尚未解鎖" : "開始行動"}
      </button>
    </article>
  );
}

export function MeridianDashboard() {
  const { state, now, saveStatus, startAction, stopAction, selectRegion, selectCategory } = useGameStore();
  const selectedRegion = REGIONS.find((region) => region.id === state.selectedRegionId) ?? REGIONS[0];
  const currentAction = state.currentAction ? getActionDefinition(state.currentAction.actionId) : undefined;
  const visibleActions = ACTIONS.filter(
    (action) =>
      action.regionId === selectedRegion.id &&
      (state.selectedCategory === "all" || action.category === state.selectedCategory),
  );
  const currentCheck = currentAction ? calculateCheckBreakdown(currentAction, state) : null;
  const remainingMs = state.currentAction ? state.currentAction.cycleEndsAt - now : 0;
  const currentProgress =
    state.currentAction && currentAction
      ? Math.min(1, Math.max(0, 1 - remainingMs / (currentAction.durationSec * 1000)))
      : 0;
  const saveLabel =
    saveStatus === "saved"
      ? "Saved"
      : saveStatus === "saving"
        ? "Saving…"
        : saveStatus === "loading"
          ? "Loading…"
          : "Local save unavailable";

  return (
    <main className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.brandKicker}>航海日誌</span>
          <strong>Meridian Idle</strong>
        </div>
        <div className={styles.resourceStrip} aria-label="全局資源">
          <span>
            船長 {state.captain.name} Lv.{state.captain.level}
          </span>
          <span>金幣 {formatNumber(state.resources.gold)}</span>
          <span>名聲 {formatNumber(state.resources.fame)}</span>
        </div>
        <div className={styles.saveState} data-status={saveStatus}>
          {saveLabel}
        </div>
      </header>

      <aside className={styles.leftSidebar} aria-label="船長狀態與導航">
        <section className={styles.summaryCard}>
          <span className={styles.eyebrow}>Captain</span>
          <h2>{state.captain.name}</h2>
          <p>{state.captain.rank}</p>
          <dl>
            <div>
              <dt>會計</dt>
              <dd>{state.skills.accounting}</dd>
            </div>
            <div>
              <dt>操帆</dt>
              <dd>{state.skills.sailing}</dd>
            </div>
            <div>
              <dt>檢查</dt>
              <dd>{state.skills.inspection}</dd>
            </div>
          </dl>
        </section>
        <section className={styles.compactSummary}>
          <span className={styles.eyebrow}>Ship</span>
          <strong>聖艾爾摩號</strong>
          <span>小型商用帆船 · 操控 28</span>
        </section>
        <section className={styles.compactSummary}>
          <span className={styles.eyebrow}>Officer</span>
          <strong>艾蓮娜・羅西</strong>
          <span>會計長 · 義大利語</span>
        </section>
        <nav className={styles.mainNav} aria-label="主選單">
          {["海域", "Knowledge", "Mastery", "副官", "船隻", "母港", "遠征"].map((item, index) => (
            <button type="button" key={item} aria-current={index === 0 ? "page" : undefined}>
              {item}
              <span>{index === 0 ? "目前" : "入口"}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className={styles.mainArea}>
        <section className={styles.scenePanel} aria-label="目前航行場景">
          <div className={styles.sceneSky} />
          <div className={styles.sun} />
          <div className={styles.distantLand} />
          <div className={styles.ship} aria-hidden="true">
            <span />
          </div>
          <div className={styles.sceneWater} />
          <div className={styles.sceneCopy}>
            <span>{selectedRegion.name}</span>
            <h1>{currentAction?.name ?? "港外待命"}</h1>
            <p>{currentAction ? "風向穩定，船員正在執行航海日誌中的任務。" : "選擇下一項 Action，準備船隻與副官。"}</p>
          </div>
        </section>

        <section className={styles.actionPanel}>
          <div className={styles.regionTabs} role="tablist" aria-label="海域">
            {REGIONS.map((region) => (
              <button
                type="button"
                role="tab"
                aria-selected={region.id === selectedRegion.id}
                key={region.id}
                onClick={() => selectRegion(region.id)}
              >
                {region.name}
                <span>Tier {region.tier}</span>
              </button>
            ))}
          </div>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.eyebrow}>Available actions</span>
              <h2>{selectedRegion.name}</h2>
            </div>
            <span>
              熟悉度 {selectedRegion.familiarity}/{selectedRegion.nextTierAt}
            </span>
          </div>
          <div className={styles.categoryFilters} aria-label="行動分類">
            {(Object.keys(CATEGORY_LABELS) as ActionFilter[]).map((category) => (
              <button
                type="button"
                aria-pressed={state.selectedCategory === category}
                key={category}
                onClick={() => selectCategory(category)}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
          <div className={styles.actionGrid}>
            {visibleActions.length > 0 ? (
              visibleActions.map((action) => (
                <ActionCard key={action.id} action={action} state={state} onStart={startAction} />
              ))
            ) : (
              <p className={styles.emptyState}>這個分類目前沒有可顯示的 Action。</p>
            )}
          </div>
        </section>
      </section>

      <aside className={styles.rightSidebar} aria-label="目前行動詳情">
        <section className={styles.currentActionPanel}>
          <span className={styles.eyebrow}>Current action</span>
          <h2>{currentAction?.name ?? "尚未選擇行動"}</h2>
          <p>{currentAction ? `下一輪剩餘 ${formatRemaining(remainingMs)}` : "從中央面板選擇一項 Action。"}</p>
          <div className={styles.progressTrack} aria-label="行動進度">
            <span style={{ width: `${currentProgress * 100}%` }} />
          </div>
          <div className={styles.progressMeta}>
            <span>{Math.round(currentProgress * 100)}%</span>
            <span>{currentAction ? "持續執行" : "待命"}</span>
          </div>
          {currentAction && (
            <button type="button" className={styles.stopButton} onClick={stopAction}>
              停止行動
            </button>
          )}
        </section>

        <section className={styles.detailPanel}>
          <span className={styles.eyebrow}>Reward preview</span>
          {currentAction ? (
            currentAction.rewards.map((reward) => (
              <div className={styles.detailRow} key={`${reward.type}-${reward.targetId ?? reward.label}`}>
                <span>{reward.label}</span>
                <strong>
                  {reward.minAmount}–{reward.maxAmount}
                </strong>
              </div>
            ))
          ) : (
            <p className={styles.placeholder}>選擇 Action 後顯示預期報酬。</p>
          )}
        </section>

        <section className={styles.detailPanel}>
          <span className={styles.eyebrow}>Check breakdown</span>
          {currentCheck && currentAction ? (
            <>
              <div className={styles.detailRow}>
                <span>Base Score</span>
                <strong>{currentCheck.baseScore}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>{SKILL_LABELS[currentCheck.skillId]}</span>
                <strong>{currentCheck.skillValue}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Roll 範圍</span>
                <strong>
                  {Math.round(currentCheck.rollMin)}–{Math.round(currentCheck.rollMax)}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>成功率</span>
                <strong>{percentage(currentCheck.successRate)}</strong>
              </div>
            </>
          ) : (
            <p className={styles.placeholder}>判定來源會在此完整拆解。</p>
          )}
        </section>

        <section className={styles.logPanel}>
          <span className={styles.eyebrow}>Event log</span>
          <ol>
            {state.eventLog.slice(0, 5).map((entry) => (
              <li key={entry.id} data-tone={entry.tone}>
                {entry.message}
              </li>
            ))}
          </ol>
        </section>
      </aside>

      <nav className={styles.mobileNav} aria-label="手機版主選單">
        {["Action", "船長", "副官", "船隻", "紀錄"].map((item) => (
          <button type="button" key={item}>
            {item}
          </button>
        ))}
      </nav>
    </main>
  );
}

export type { ActionCategory };
