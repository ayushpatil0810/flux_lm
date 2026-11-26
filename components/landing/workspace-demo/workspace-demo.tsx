"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import {
  ArrowUp01Icon,
  BookOpen01Icon,
  File01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import type { Act } from "./kit/act";
import { Badge } from "./kit/controls/Badge";
import { Button as DemoButton } from "./kit/controls/Button";
import { Field } from "./kit/controls/Field";
import { Collapse } from "./kit/motion/Collapse";
import { Stream } from "./kit/motion/Stream";
import { Row } from "./kit/parts/Row";
import { useReducedMotion } from "./kit/reduced-motion";
import { Stage } from "./kit/stage";
import { Text, Window } from "./kit/window";
import styles from "./workspace-demo.module.css";

const QUESTION = "How do trees cool cities?";
const ANSWER =
  "Trees shade streets and cool the air as water evaporates from their leaves. The effect is strongest where tree canopies cover large areas of pavement.";
const WORDS = ANSWER.split(" ").length;
const SOURCES = [
  { title: "Canopy study", pages: 12, citedPage: 8 },
  { title: "Field notes", pages: 4, citedPage: 3 },
] as const;

type Scene = {
  draft: string;
  focused: boolean;
  phase: "intro" | "thinking" | "answer";
  words: number;
  cited: boolean;
};

const initial: Scene = {
  draft: "",
  focused: false,
  phase: "intro",
  words: 0,
  cited: false,
};
const poster: Scene = {
  ...initial,
  phase: "answer",
  words: WORDS,
  cited: true,
};
const compact = { below: 800, width: 358, height: 329 };
const cursor = {
  at: { at: "chat", x: 0.88, y: 0.6 },
  kind: "pointer",
  idle: 1000,
} as const;
const emptySubscribe = () => () => {};

async function playResearchDemo(act: Act<Scene>) {
  await act.wait(850);
  await act.click({ at: "draft", x: 0.68 });
  act.mark("type");
  act.put({ focused: true });
  await act.type("draft", QUESTION, { interval: 48 });
  await act.wait(260);

  act.mark("send");
  await act.click("send");
  act.put({ draft: "", focused: false, phase: "thinking" });
  const chat = act.rect("chat");
  await act.move(
    { x: chat.x + chat.width * 0.94, y: chat.y + chat.height * 0.78 },
    { duration: 450 },
  );
  await act.wait(850);

  act.mark("answer");
  act.put({ phase: "answer", words: 5 });
  for (let count = 6; count <= WORDS; count++) {
    await act.wait(78);
    act.put({ words: count });
  }
  await act.wait(320);
  act.mark("citations");
  act.put({ cited: true });
  await act.wait(3100);
}

function SourcesPanel() {
  return (
    <div className={styles.sourcesPanel}>
      <div className={styles.panelHeader}>
        <span>Sources</span>
        <Badge>{SOURCES.length}</Badge>
      </div>
      <div className={styles.sourceList}>
        {SOURCES.map(({ title, pages }) => (
          <Row
            key={title}
            pad={10}
            lead={
              <span className={styles.fileIcon}>
                <HugeiconsIcon icon={File01Icon} size={15} strokeWidth={1.6} />
              </span>
            }
            title={<Text>{`${title}.pdf`}</Text>}
            subtitle={<Text>{`PDF · ${pages} pages`}</Text>}
          />
        ))}
      </div>
      <DemoButton
        variant="secondary"
        icon={<HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.7} />}
        className={styles.addSource}
      >
        Add sources
      </DemoButton>
    </div>
  );
}

export function WorkspaceDemo() {
  const { resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [run, setRun] = useState(0);
  const script = useCallback(async (act: Act<Scene>) => {
    await playResearchDemo(act);
    setPlaying(false);
  }, []);

  function controlPlayback() {
    if (!playing) {
      setRun((previous) => previous + 1);
    }
    setPlaying(!playing);
  }

  const sourceCount = (
    <Badge
      icon={<HugeiconsIcon icon={BookOpen01Icon} size={13} strokeWidth={1.6} />}
    >
      {SOURCES.length} sources
    </Badge>
  );

  return (
    <figure id="workspace-demo" className={styles.figure}>
      <figcaption className="sr-only">
        Flux workspace demo. A researcher asks how trees cool cities. Flux
        explains how shade and evaporation reduce heat, citing a canopy study
        and field notes.
      </figcaption>
      {!reducedMotion && (
        <div className={styles.controls}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 rounded-md px-2.5 text-xs"
            onClick={controlPlayback}
          >
            {playing ? "Skip animation" : "Replay demo"}
          </Button>
        </div>
      )}
      <div className={styles.scene} aria-hidden="true">
        <Stage
          key={run}
          width={944}
          height={380}
          compact={compact}
          theme={hydrated && resolvedTheme === "dark" ? "dark" : "light"}
          fidelity="realistic"
          className={styles.stage}
          initial={initial}
          poster={poster}
          cursor={playing ? cursor : undefined}
          script={playing ? script : undefined}
          play="once"
        >
          {(scene, _, layout) => (
            <Window
              className={styles.window}
              lights="grey"
              title={
                layout === "wide"
                  ? "Flux · Urban heat research"
                  : "Urban heat research"
              }
              toolbar={layout === "wide" ? <Badge>Example</Badge> : sourceCount}
            >
              <div className={styles.workspace}>
                {layout === "wide" && <SourcesPanel />}
                <div className={styles.chat} data-target="chat">
                  {layout === "wide" && (
                    <div className={styles.panelHeader}>
                      <span>Chat</span>
                      {sourceCount}
                    </div>
                  )}
                  <div className={styles.chatContent}>
                    <div className={styles.thread}>
                      <Collapse open={scene.phase === "intro"}>
                        {scene.phase === "intro" && (
                          <div className={styles.intro}>
                            <Text className={styles.introTitle}>
                              Ask your sources
                            </Text>
                            <Text>
                              What would you like to understand about urban
                              heat?
                            </Text>
                            {layout === "compact" && (
                              <div className={styles.sourceStrip}>
                                {SOURCES.map(({ title }) => (
                                  <Badge key={title}>{title}.pdf</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Collapse>
                      <Collapse
                        open={scene.phase !== "intro"}
                        reveal="drop"
                        from="below"
                      >
                        <div className={styles.question}>
                          <Text>{QUESTION}</Text>
                        </div>
                      </Collapse>
                      <Collapse
                        className={styles.reply}
                        open={scene.phase === "thinking"}
                      >
                        {scene.phase === "thinking" && (
                          <Text className={styles.thinking}>
                            Reading your sources…
                          </Text>
                        )}
                      </Collapse>
                      <Collapse open={scene.phase === "answer"}>
                        <div className={styles.answer}>
                          <Stream text={ANSWER} count={scene.words} />
                          <div
                            className={styles.citations}
                            data-on={scene.cited || undefined}
                          >
                            {SOURCES.map(({ title, citedPage }, index) => (
                              <Badge
                                key={title}
                                className={styles.citation}
                                icon={
                                  <span className={styles.referenceNumber}>
                                    {index + 1}
                                  </span>
                                }
                              >
                                {title} · p. {citedPage}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Collapse>
                    </div>
                    <Field
                      value={scene.draft}
                      placeholder="Ask a question…"
                      focused={scene.focused}
                      box={{ "data-target": "draft", "data-cursor": "ibeam" }}
                      trailing={
                        <DemoButton
                          data-target="send"
                          data-cursor="pointer"
                          className={styles.send}
                          variant={scene.draft ? "primary" : "tertiary"}
                          size="small"
                          icon={
                            <HugeiconsIcon
                              icon={ArrowUp01Icon}
                              size={14}
                              strokeWidth={2}
                            />
                          }
                          aria-label="Send"
                        />
                      }
                    />
                  </div>
                </div>
              </div>
            </Window>
          )}
        </Stage>
      </div>
    </figure>
  );
}
