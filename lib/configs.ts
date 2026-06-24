// A "config" is a sequence of pre-configured commands a container runs after
// boot, inside the guest (sent over the serial console). Configs provision the
// container and can launch an app — e.g. the OpenTTD config installs and starts
// OpenTTD inside the container.

export interface ContainerConfig {
  id: string;
  label: string;
  blurb: string;
  /** Commands typed into the guest shell, in order, after boot. */
  commands: string[];
  /** OS image this config is meant to run on (id from os-images). */
  image: string;
}

export const CONFIGS: ContainerConfig[] = [
  {
    id: "shell",
    label: "Shell",
    blurb: "Interactive BusyBox shell. No preset commands.",
    commands: [],
    image: "buildroot",
  },
  {
    id: "system-info",
    label: "System info",
    blurb: "Runs a sequence of inspection commands in the container.",
    commands: [
      "echo '== clientside-containers config: system-info =='",
      "uname -a",
      "cat /proc/cpuinfo | grep -m1 'model name' || head -n 5 /proc/cpuinfo",
      "head -n 3 /proc/meminfo",
      "ls -la /",
      "echo '== done =='",
    ],
    image: "buildroot",
  },
  {
    id: "openttd",
    label: "OpenTTD",
    blurb: "Installs and launches OpenTTD inside the container.",
    // The end goal: run OpenTTD in the container. On the minimal Buildroot image
    // these will report the tools are missing; a desktop-capable image (with a
    // package manager + framebuffer) is required to actually launch the game.
    commands: [
      "echo '== clientside-containers config: openttd =='",
      "command -v openttd || echo 'openttd not installed in this image'",
      "command -v apk && apk add --no-cache openttd openttd-openmsx openttd-opensfx openttd-opengfx",
      "command -v apt-get && apt-get update && apt-get install -y openttd openttd-opengfx openttd-opensfx",
      "openttd || echo 'OpenTTD needs a desktop-capable image to launch'",
    ],
    image: "buildroot",
  },
];

export function getConfig(id: string | undefined): ContainerConfig {
  return CONFIGS.find((c) => c.id === id) ?? CONFIGS[0];
}
