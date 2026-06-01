"use client";

import { useId, useState, type ReactNode } from "react";
import styles from "../map-stage.module.css";

export function TacticalSwitch({
  checked,
  disabled,
  label,
  onChange,
}: Readonly<{
  checked: boolean;
  disabled?: boolean;
  label?: string;
  onChange: () => void;
}>) {
  return (
    <span className={styles.osirisToggle}>
      <input
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        type="checkbox"
      />
      <span aria-hidden="true" />
    </span>
  );
}

export function CollapsiblePanel({
  children,
  control,
  defaultOpen = true,
  meta,
  onOpenChange,
  open: controlledOpen,
  title,
}: Readonly<{
  children: ReactNode;
  control?: ReactNode;
  defaultOpen?: boolean;
  meta?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title: string;
}>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const panelId = useId();
  const open = controlledOpen ?? uncontrolledOpen;

  function handleToggle() {
    const nextOpen = !open;

    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  return (
    <section className={`${styles.collapsibleSection} ${open ? styles.collapsibleSectionOpen : ""}`}>
      <div className={styles.collapsibleSummary}>
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className={styles.collapsibleTrigger}
          onClick={handleToggle}
          type="button"
        >
          <span className={styles.collapsibleTitle}>{title}</span>
          <span className={styles.collapsibleMeta}>{meta ?? "Toggle"}</span>
        </button>
        {control ? (
          <span
            className={styles.collapsibleControl}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {control}
          </span>
        ) : null}
        <span aria-hidden="true" className={`${styles.collapsibleChevron} ${open ? styles.collapsibleChevronOpen : ""}`}>
          ^
        </span>
      </div>
      {open ? (
        <div className={styles.collapsibleBody} id={panelId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
