import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const COLORS = {
  bg: "#090909",
  accent: "#0066ff",
  text: "#f0f0f0",
  secondary: "#888888",
  success: "#22c55e",
};

const headingFont =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const monoFont =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const centerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  width: "100%",
  height: "100%",
  padding: "80px",
  boxSizing: "border-box",
};

const Scene1: React.FC = () => {
  const frame = useCurrentFrame();

  const firstOpacity = interpolate(frame, [0, 25, 100, 140], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const glitch = frame >= 60 && frame <= 84;
  const xJitter = glitch ? Math.sin(frame * 1.8) * 10 : 0;

  const secondOpacity = interpolate(frame, [70, 105, 179], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glow = interpolate(frame, [95, 130, 179], [0.2, 1, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ ...centerStyle, backgroundColor: COLORS.bg }}>
      <div
        style={{
          position: "absolute",
          opacity: firstOpacity,
          transform: `translateX(${xJitter}px)`,
          fontFamily: headingFont,
          fontSize: 94,
          lineHeight: 1.05,
          fontWeight: 600,
          color: COLORS.text,
          letterSpacing: "-0.04em",
        }}
      >
        Your AI forgets everything.
      </div>

      <div
        style={{
          opacity: secondOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily: headingFont,
            fontSize: 98,
            lineHeight: 1,
            fontWeight: 800,
            color: COLORS.text,
            letterSpacing: "-0.04em",
            textShadow: `0 0 ${20 * glow}px rgba(0, 102, 255, ${0.45 * glow})`,
          }}
        >
          Memory Crystal fixes that.
        </div>
        <div
          style={{
            fontFamily: headingFont,
            fontSize: 42,
            fontWeight: 500,
            color: COLORS.secondary,
            letterSpacing: "0.01em",
          }}
        >
          Persistent memory for AI agents
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2: React.FC = () => {
  const frame = useCurrentFrame();

  const terminalIn = spring({
    frame,
    fps: 30,
    config: { damping: 200, stiffness: 120 },
  });

  const command = "curl -fsSL memorycrystal.ai/install | bash";
  const typedChars = Math.floor(interpolate(frame, [20, 100], [0, command.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));

  const checks = [
    "API key validated",
    "Plugin installed",
    "Config updated",
    "Memory Crystal is active",
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: monoFont,
      }}
    >
      <div
        style={{
          width: 1400,
          height: 760,
          backgroundColor: "#101010",
          border: "1px solid #1f1f1f",
          transform: `scale(${0.96 + terminalIn * 0.04})`,
          opacity: terminalIn,
          padding: 40,
          boxSizing: "border-box",
        }}
      >
        <div style={{ color: COLORS.secondary, fontSize: 26, marginBottom: 24 }}>
          terminal
        </div>

        <div style={{ color: COLORS.text, fontSize: 38, marginBottom: 44 }}>
          <span style={{ color: COLORS.accent }}>$ </span>
          {command.slice(0, typedChars)}
          <span style={{ opacity: frame % 20 < 10 ? 1 : 0, color: COLORS.accent }}>|</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {checks.map((line, i) => {
            const appearAt = 108 + i * 16;
            const visible = frame >= appearAt;
            const y = visible
              ? 0
              : interpolate(frame, [appearAt - 8, appearAt], [8, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

            return (
              <div
                key={line}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: `translateY(${y}px)`,
                  fontSize: 34,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <span style={{ color: COLORS.success }}>✓</span>
                <span style={{ color: COLORS.text }}>{line}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const block = (
    label: string,
    text: string,
    idx: number,
    top: number,
  ): React.ReactNode => {
    const start = 42 + idx * 20;
    const progress = interpolate(frame, [start, start + 26], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    const x = interpolate(progress, [0, 1], [80, 0]);
    return (
      <div
        key={label}
        style={{
          position: "absolute",
          top,
          left: 80,
          right: 80,
          backgroundColor: "#0f1520",
          border: `1px solid rgba(0,102,255,${0.7 * progress})`,
          padding: "24px 28px",
          opacity: progress,
          transform: `translateX(${x}px)`,
          boxShadow: `0 0 20px rgba(0,102,255,${0.18 * progress})`,
        }}
      >
        <div style={{ color: COLORS.accent, fontFamily: monoFont, fontSize: 22, marginBottom: 12 }}>
          {label}
        </div>
        <div
          style={{
            color: COLORS.text,
            fontFamily: headingFont,
            fontSize: 34,
            lineHeight: 1.25,
            fontWeight: 500,
          }}
        >
          {text}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, flexDirection: "row" }}>
      <div
        style={{
          width: width / 2,
          height,
          borderRight: "1px solid #1b1b1b",
          padding: "88px 72px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontFamily: monoFont, color: COLORS.secondary, fontSize: 24, marginBottom: 28 }}>
          chat
        </div>
        <div
          style={{
            backgroundColor: "#101010",
            border: "1px solid #1d1d1d",
            padding: "24px 26px",
            fontFamily: headingFont,
            color: COLORS.text,
            fontSize: 40,
            lineHeight: 1.2,
            fontWeight: 500,
          }}
        >
          What architecture did we decide on?
        </div>
      </div>

      <div
        style={{
          width: width / 2,
          height,
          position: "relative",
          paddingTop: 88,
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontFamily: monoFont, color: COLORS.secondary, fontSize: 24, marginLeft: 80 }}>
          memory crystal recall
        </div>
        {block("[episodic/decision]", "Chose Convex over Supabase — March 5", 0, 178)}
        {block(
          "[semantic/fact]",
          "Real-time subscriptions were the deciding factor",
          1,
          352,
        )}
      </div>
    </AbsoluteFill>
  );
};

const Scene4: React.FC = () => {
  const frame = useCurrentFrame();

  const pulse = 1 + Math.sin(frame / 12) * 0.015;
  const glow = 0.35 + (Math.sin(frame / 12) + 1) * 0.18;

  return (
    <AbsoluteFill style={{ ...centerStyle, backgroundColor: COLORS.bg }}>
      <div
        style={{
          fontFamily: headingFont,
          color: COLORS.text,
          fontSize: 128,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          fontWeight: 800,
          marginBottom: 26,
        }}
      >
        Memory Crystal
      </div>

      <div
        style={{
          fontFamily: headingFont,
          color: COLORS.text,
          fontSize: 54,
          lineHeight: 1.2,
          fontWeight: 500,
          marginBottom: 50,
        }}
      >
        Stop re-explaining. Start shipping.
      </div>

      <div
        style={{
          fontFamily: monoFont,
          color: COLORS.accent,
          fontSize: 68,
          fontWeight: 700,
          marginBottom: 24,
          transform: `scale(${pulse})`,
          textShadow: `0 0 22px rgba(0,102,255,${glow})`,
        }}
      >
        memorycrystal.ai
      </div>

      <div
        style={{
          fontFamily: headingFont,
          color: COLORS.secondary,
          fontSize: 38,
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        Free to start
      </div>
    </AbsoluteFill>
  );
};

export const MemoryCrystalDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Sequence from={0} durationInFrames={180}>
        <Scene1 />
      </Sequence>
      <Sequence from={180} durationInFrames={180}>
        <Scene2 />
      </Sequence>
      <Sequence from={360} durationInFrames={180}>
        <Scene3 />
      </Sequence>
      <Sequence from={540} durationInFrames={180}>
        <Scene4 />
      </Sequence>
    </AbsoluteFill>
  );
};
