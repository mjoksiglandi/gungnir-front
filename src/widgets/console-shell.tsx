import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./console-shell.module.css";

const navItems = [
  { href: "/operations", label: "Operations" },
  { href: "/assets", label: "Devices" },
  { href: "/incidents", label: "Missions" },
  { href: "/alerts", label: "Alerts" },
];

export function ConsoleShell({
  activePath,
  children,
}: Readonly<{
  activePath: string;
  children: ReactNode;
}>) {
  function isNavActive(href: string) {
    return activePath === href || activePath.startsWith(`${href}/`);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandCluster}>
          <div className={styles.brandMark} aria-hidden="true">
            <span className={styles.brandWingLeft} />
            <span className={styles.brandWingRight} />
          </div>
          <div className={styles.brand}>
            <span className={styles.title}>GUGNIR C4</span>
            <span className={styles.version}>v0.3.1</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = isNavActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.statusBar}>
          <div className={styles.linkStatus}>
            <span className={styles.statusDot} aria-hidden="true" />
            Link: Good
          </div>
          <div className={styles.statusMetrics} aria-label="Operational summary">
            <span>12 dev</span>
            <span>98%</span>
          </div>
          <div className={styles.userPill}>
            <div className={styles.userAvatar}>JC</div>
            <div className={styles.userMeta}>
              <strong>Operator</strong>
              <span>Command Unit</span>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
