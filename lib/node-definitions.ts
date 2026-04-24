import type { FlowNode, NodeKind } from "@/types/flow";
import { nanoid } from "nanoid";

type NodeTemplate = {
  type: NodeKind;
  label: string;
  description: string;
  category: "input" | "processing" | "output";
  fields?: Array<{
    key: string;
    label: string;
    placeholder?: string;
    multiline?: boolean;
  }>;
};

export const NODE_TEMPLATES: NodeTemplate[] = [
  {
    type: "textPrompt",
    label: "Text Prompt",
    description: "Provide creative direction, narrative, or a motion brief.",
    category: "input",
    fields: [
      {
        key: "prompt",
        label: "Prompt",
        placeholder: "Describe the motion sequence you want to generate.",
        multiline: true,
      },
    ],
  },
  {
    type: "mediaUpload",
    label: "Media Upload",
    description: "Upload an image or provide an image URL to use as the first frame for video generation.",
    category: "input",
    fields: [{ key: "mediaUrl", label: "Image URL", placeholder: "https://cdn.example.com/asset.png" }],
  },
  {
    type: "videoRender",
    label: "Video Render",
    description: "Generate render instructions and export-ready motion output.",
    category: "output",
  },
];

export function createNodeFromTemplate(type: NodeKind, position = { x: 120, y: 120 }): FlowNode {
  const template = NODE_TEMPLATES.find((item) => item.type === type);

  if (!template) {
    throw new Error(`Unknown node type: ${type}`);
  }

  return {
    id: nanoid(),
    type: template.type,
    position,
    data: {
      label: template.label,
      description: template.description,
      category: template.category,
      fields: template.fields,
      values: Object.fromEntries((template.fields ?? []).map((field) => [field.key, ""])),
      status: "idle",
    },
  };
}
