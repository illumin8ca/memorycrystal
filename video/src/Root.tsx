import { Composition } from "remotion";
import { MemoryCrystalDemo } from "./MemoryCrystalDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MemoryCrystalDemo"
        component={MemoryCrystalDemo}
        durationInFrames={720}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
