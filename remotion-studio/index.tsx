import { registerRoot, Composition } from "remotion";
import { FlowMotionComposition } from "./FlowMotionComposition";

const RemotionRoot = () => (
  <Composition
    id="FlowMotionComposition"
    component={FlowMotionComposition}
    durationInFrames={300}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{
      scenes: [],
    }}
  />
);

registerRoot(RemotionRoot);
