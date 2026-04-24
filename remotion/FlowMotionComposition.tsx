import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type Scene = {
  title: string;
  description: string;
  durationInSeconds: number;
};

export function FlowMotionComposition({
  scenes = [],
}: {
  scenes?: Scene[];
}) {
  const fallbackScenes =
    scenes.length > 0
      ? scenes
      : [
        { title: "FlowMotion AI", description: "Visual AI workflow builder for motion graphics.", durationInSeconds: 3 },
        { title: "Storyboard to motion", description: "Prompt, extract, generate, animate, render.", durationInSeconds: 3 },
      ];

  const { fps } = useVideoConfig();
  let startFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF", color: "#000000", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {fallbackScenes.map((scene, index) => {
        const durationInFrames = Math.round(scene.durationInSeconds * fps);
        const sequenceStart = startFrame;
        startFrame += durationInFrames;

        return (
          <Sequence key={`${scene.title}-${index}`} from={sequenceStart} durationInFrames={durationInFrames}>
            <SceneCard index={index + 1} title={scene.title} description={scene.description} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

function SceneCard({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 120 },
  });
  const translateY = interpolate(entrance, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        padding: 96,
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        border: "1px solid #000000",
        margin: 48,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div style={{ fontSize: 18, letterSpacing: "0.3em", textTransform: "uppercase" }}>Scene {index}</div>
      <div style={{ alignSelf: "center" }}>
        <div style={{ fontSize: 84, lineHeight: 1, maxWidth: 1200 }}>{title}</div>
        <div style={{ marginTop: 28, maxWidth: 960, fontSize: 30, lineHeight: 1.35 }}>{description}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
        <span>FlowMotion AI</span>
        <span>Minimal Motion System</span>
      </div>
    </AbsoluteFill>
  );
}
