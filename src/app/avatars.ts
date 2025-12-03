export type AvatarPose = "idle" | "windup" | "throw";

export type AvatarOption = {
  id: string;
  label: string;
  role: string;
  frames: Record<AvatarPose, string>;
};

export const avatarOptions: AvatarOption[] = [
  {
    id: "ace",
    label: "Ace Highroller",
    role: "Lucky Gambler",
    frames: {
      idle: "/assets/avatars/ace-idle.svg",
      windup: "/assets/avatars/ace-windup.svg",
      throw: "/assets/avatars/ace-throw.svg",
    },
  },
  {
    id: "shadow",
    label: "Shadow Sleuth",
    role: "Midnight Detective",
    frames: {
      idle: "/assets/avatars/shadow-idle.svg",
      windup: "/assets/avatars/shadow-windup.svg",
      throw: "/assets/avatars/shadow-throw.svg",
    },
  },
  {
    id: "sunny",
    label: "Sunny Spinner",
    role: "Carnival Champ",
    frames: {
      idle: "/assets/avatars/sunny-idle.svg",
      windup: "/assets/avatars/sunny-windup.svg",
      throw: "/assets/avatars/sunny-throw.svg",
    },
  },
  {
    id: "nova",
    label: "Nova Dicey",
    role: "Cosmic Maverick",
    frames: {
      idle: "/assets/avatars/nova-idle.svg",
      windup: "/assets/avatars/nova-windup.svg",
      throw: "/assets/avatars/nova-throw.svg",
    },
  },
];

export const getAvatar = (id: string) =>
  avatarOptions.find((option) => option.id === id) ?? avatarOptions[0];
