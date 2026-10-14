# Token 依赖与组件消费快照

来源：当前 DESIGN 默认 CSS；生成源始终是 DESIGN.md。本表不含新值、不作为第二份配置。范围：372个默认 token 的直接变量依赖及 theme/src CSS直接引用；TS/宿主动态引用和CSS间接继承未计为直接消费。空直接消费不等于死代码。

| Token | 直接依赖 | 直接 CSS 消费文件 |
| --- | --- | --- |
| `--palette-primary` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-on-primary` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-secondary` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-on-secondary` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-foreground` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-muted-foreground` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-background` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-canvas` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-shell` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-surface` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-support` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-raised` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-overlay` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-muted` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-separator` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-surface-line` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-surface-line-strong` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-input-line` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-info` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-info-foreground` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-warning` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-warning-foreground` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-success` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-success-foreground` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-error` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-error-foreground` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-error-surface` | `--palette-error` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-state-base` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-shadow-ink` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-input-surface` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-on-danger` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-table-stripe` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--base-font-sans` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--base-font-mono` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--base-weight-regular` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--base-weight-medium` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--base-weight-semibold` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--base-spacing` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--base-radius` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--base-line-thin` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--base-line-emphasis` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-series-1` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-series-2` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-series-3` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-series-4` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-series-5` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-series-6` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-canvas` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-node-fill` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-node-stroke` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-node-text` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-edge` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-caption` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-series-1` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-series-2` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-series-3` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-series-4` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-series-5` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--palette-document-series-6` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--selected-weight` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--selected-base` | `--layer-surface` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--info-soft-weight` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--info-line-weight` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--warning-soft-weight` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--warning-line-weight` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--success-soft-weight` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--success-line-weight` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--error-soft-weight` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--error-line-weight` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--action-primary` | `--palette-primary` | `auth.css`, `base.css`, `button.css`, `feedback.css`, `forms.css`, `layout.css`, `navigation.css`, `table.css`, `widgets.css` |
| `--action-primary-foreground` | `--palette-on-primary` | `forms.css`, `widgets.css` |
| `--action-secondary` | `--palette-secondary` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--action-secondary-foreground` | `--palette-on-secondary` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--foreground` | `--palette-foreground` | `base.css`, `button.css`, `floating.css`, `forms.css`, `layout.css`, `navigation.css`, `widgets.css` |
| `--muted-foreground` | `--palette-muted-foreground` | `auth.css`, `base.css`, `dialog.css`, `feedback.css`, `forms.css`, `layout.css`, `navigation.css`, `table.css`, `widgets.css` |
| `--background` | `--palette-background` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--muted` | `--palette-muted` | `base.css`, `button.css`, `feedback.css`, `forms.css`, `layout.css` |
| `--separator-line` | `--palette-separator` | `base.css`, `layout.css`, `navigation.css`, `table.css`, `widgets.css` |
| `--surface-line` | `--palette-surface-line` | `button.css`, `dialog.css`, `floating.css`, `forms.css`, `table.css`, `widgets.css` |
| `--surface-line-strong` | `--palette-surface-line-strong` | `button.css`, `feedback.css`, `widgets.css` |
| `--input` | `--palette-input-line` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layer-canvas` | `--palette-canvas` | `base.css` |
| `--layer-shell` | `--palette-shell` | `layout.css` |
| `--layer-surface` | `--palette-surface` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layer-support` | `--palette-support` | `navigation.css`, `widgets.css` |
| `--layer-raised` | `--palette-raised` | `button.css`, `table.css`, `widgets.css` |
| `--layer-overlay` | `--palette-overlay` | `dialog.css`, `floating.css`, `layout.css` |
| `--input-surface` | `--palette-input-surface` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--interaction-focus` | `--action-primary` | `base.css`, `forms.css`, `layout.css` |
| `--interaction-selected` | `--action-primary`、`--selected-weight`、`--selected-base` | `feedback.css`, `forms.css`, `layout.css`, `navigation.css`, `sheet.css`, `table.css`, `widgets.css` |
| `--interaction-selected-foreground` | `--action-primary` | `navigation.css`, `table.css`, `widgets.css` |
| `--interaction-hover` | `--muted` | `button.css`, `forms.css`, `layout.css`, `navigation.css`, `table.css`, `widgets.css` |
| `--interaction-hover-foreground` | `--foreground` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--interaction-pressed` | `--action-primary`、`--layer-raised` | `button.css`, `floating.css`, `forms.css`, `layout.css`, `navigation.css`, `table.css`, `widgets.css` |
| `--focus-width` | `--base-line-emphasis` | `auth.css`, `base.css`, `dialog.css`, `feedback.css`, `floating.css`, `forms.css`, `layout.css`, `search-toolbar.css`, `table.css`, `widgets.css` |
| `--focus-offset` | 根值，见 DESIGN | `auth.css`, `base.css`, `dialog.css`, `feedback.css`, `floating.css`, `forms.css`, `layout.css`, `search-toolbar.css`, `sheet.css`, `table.css`, `widgets.css` |
| `--status-info` | `--palette-info` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--status-info-foreground` | `--palette-info-foreground` | `feedback.css` |
| `--status-info-soft` | `--status-info`、`--info-soft-weight`、`--palette-state-base` | `feedback.css` |
| `--status-info-line` | `--status-info`、`--info-line-weight`、`--status-info-soft` | `feedback.css` |
| `--status-warning` | `--palette-warning` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--status-warning-foreground` | `--palette-warning-foreground` | `feedback.css` |
| `--status-warning-soft` | `--status-warning`、`--warning-soft-weight`、`--palette-state-base` | `feedback.css` |
| `--status-warning-line` | `--status-warning`、`--warning-line-weight`、`--status-warning-soft` | `feedback.css` |
| `--status-success` | `--palette-success` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--status-success-foreground` | `--palette-success-foreground` | `base.css`, `feedback.css` |
| `--status-success-soft` | `--status-success`、`--success-soft-weight`、`--palette-state-base` | `feedback.css` |
| `--status-success-line` | `--status-success`、`--success-line-weight`、`--status-success-soft` | `feedback.css` |
| `--status-error` | `--palette-error` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--status-error-foreground` | `--palette-error-foreground` | `base.css`, `feedback.css`, `forms.css` |
| `--status-error-soft` | `--palette-error-surface`、`--error-soft-weight`、`--palette-state-base` | `feedback.css` |
| `--status-error-line` | `--status-error`、`--error-line-weight`、`--status-error-soft` | `feedback.css` |
| `--action-danger` | `--status-error` | `button.css` |
| `--action-danger-foreground` | `--palette-on-danger` | `button.css` |
| `--font-sans` | `--base-font-sans` | `base.css`, `button.css`, `dialog.css`, `feedback.css`, `floating.css`, `forms.css`, `navigation.css`, `table.css` |
| `--font-mono` | `--base-font-mono` | `base.css`, `feedback.css` |
| `--font-heading` | `--font-sans` | `auth.css`, `base.css` |
| `--font-document` | `--font-sans` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--font-weight-body` | `--base-weight-regular` | `base.css`, `table.css` |
| `--font-weight-control` | `--base-weight-medium` | `auth.css`, `button.css`, `feedback.css`, `floating.css`, `forms.css`, `layout.css`, `navigation.css`, `table.css`, `widgets.css` |
| `--font-weight-heading` | `--base-weight-semibold` | `auth.css`, `base.css`, `dialog.css`, `feedback.css`, `layout.css`, `widgets.css` |
| `--font-size-caption` | `--font-scale` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--line-height-caption` | `--font-size-caption`、`--line-height-scale` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--font-size-body-xs` | `--font-scale` | `auth.css`, `feedback.css`, `floating.css`, `forms.css`, `layout.css`, `navigation.css`, `table.css`, `widgets.css` |
| `--line-height-body-xs` | `--font-size-body-xs`、`--line-height-scale` | `auth.css`, `feedback.css`, `floating.css`, `forms.css`, `layout.css`, `navigation.css`, `table.css`, `widgets.css` |
| `--font-size-body-sm` | `--font-scale` | `auth.css`, `base.css`, `button.css`, `forms.css`, `navigation.css`, `table.css` |
| `--line-height-body-sm` | `--font-size-body-sm`、`--line-height-scale` | `auth.css`, `base.css`, `button.css`, `forms.css`, `navigation.css`, `table.css` |
| `--font-size-section-title` | `--font-scale` | `base.css`, `dialog.css` |
| `--line-height-section-title` | `--font-size-section-title`、`--line-height-scale` | `base.css`, `dialog.css` |
| `--font-size-secondary-value` | `--font-scale` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--line-height-secondary-value` | `--font-size-secondary-value`、`--line-height-scale` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--font-size-page-title` | `--font-scale` | `auth.css`, `base.css` |
| `--line-height-page-title` | `--font-size-page-title`、`--line-height-scale` | `auth.css`, `base.css` |
| `--font-size-metric` | `--font-scale` | `feedback.css` |
| `--line-height-metric` | `--font-size-metric`、`--line-height-scale` | `feedback.css` |
| `--spacing` | `--base-spacing` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--space-text-gap` | `--spacing` | `auth.css`, `button.css`, `dialog.css`, `feedback.css`, `floating.css`, `forms.css`, `layout.css`, `navigation.css`, `search-toolbar.css`, `table.css`, `widgets.css` |
| `--space-control-gap` | `--spacing` | `auth.css`, `base.css`, `button.css`, `dialog.css`, `feedback.css`, `floating.css`, `forms.css`, `layout.css`, `navigation.css`, `table.css`, `widgets.css` |
| `--space-content-gap` | `--spacing` | `base.css`, `dialog.css`, `feedback.css`, `floating.css`, `forms.css`, `layout.css`, `navigation.css`, `table.css` |
| `--space-section-gap` | `--spacing` | `auth.css`, `button.css`, `dialog.css`, `layout.css`, `table.css` |
| `--space-icon-gap` | `--spacing` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--control-height-xs` | `--spacing` | `button.css`, `forms.css` |
| `--control-height-sm` | `--spacing` | `button.css`, `forms.css`, `layout.css`, `navigation.css`, `widgets.css` |
| `--control-height` | `--spacing` | `dialog.css`, `feedback.css`, `floating.css`, `forms.css`, `navigation.css`, `search-toolbar.css`, `table.css`, `widgets.css` |
| `--control-height-lg` | `--spacing` | `button.css`, `forms.css` |
| `--control-icon-size` | `--spacing` | `button.css`, `dialog.css`, `feedback.css`, `floating.css`, `forms.css`, `layout.css`, `navigation.css`, `search-toolbar.css` |
| `--control-icon-size-xs` | `--spacing` | `button.css`, `forms.css` |
| `--radius-sm` | `--base-radius` | `forms.css`, `widgets.css` |
| `--radius-md` | `--base-radius` | `feedback.css`, `navigation.css` |
| `--radius-lg` | `--base-radius` | `feedback.css`, `floating.css`, `forms.css`, `navigation.css`, `table.css` |
| `--radius-xl` | `--base-radius` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--radius-2xl` | `--base-radius` | `dialog.css` |
| `--line-width-separator` | `--base-line-thin` | `base.css` |
| `--line-width-surface` | `--base-line-thin` | `auth.css`, `button.css`, `dialog.css`, `feedback.css`, `floating.css`, `forms.css`, `layout.css`, `navigation.css`, `table.css`, `widgets.css` |
| `--line-width-emphasis` | `--base-line-emphasis` | `auth.css`, `feedback.css`, `forms.css` |
| `--shadow-flat` | 根值，见 DESIGN | `feedback.css` |
| `--shadow-subtle` | `--shadow-flat` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--shadow-surface` | `--shadow-flat` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--shadow-raised` | `--shadow-flat` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--shadow-overlay` | `--palette-shadow-ink`、`--surface-line-strong` | `dialog.css`, `floating.css` |
| `--motion-duration` | 根值，见 DESIGN | `base.css`, `feedback.css`, `forms.css`, `layout.css`, `navigation.css`, `table.css`, `widgets.css` |
| `--motion-duration-fast` | 根值，见 DESIGN | `button.css`, `floating.css`, `forms.css`, `navigation.css`, `sheet.css`, `table.css`, `widgets.css` |
| `--motion-duration-enter` | 根值，见 DESIGN | `dialog.css`, `floating.css`, `navigation.css` |
| `--motion-duration-exit` | 根值，见 DESIGN | `dialog.css`, `floating.css`, `sheet.css` |
| `--motion-easing-exit` | 根值，见 DESIGN | `dialog.css`, `floating.css`, `sheet.css` |
| `--motion-distance-small` | 根值，见 DESIGN | `sheet.css` |
| `--motion-press-scale` | 根值，见 DESIGN | `button.css`, `navigation.css` |
| `--motion-enter-scale` | 根值，见 DESIGN | `dialog.css` |
| `--motion-easing` | 根值，见 DESIGN | `base.css`, `button.css`, `dialog.css`, `feedback.css`, `floating.css`, `forms.css`, `layout.css`, `navigation.css`, `sheet.css`, `table.css`, `widgets.css` |
| `--z-shell` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--z-sticky` | 根值，见 DESIGN | `table.css` |
| `--z-overlay` | 根值，见 DESIGN | `dialog.css` |
| `--z-menu` | 根值，见 DESIGN | `floating.css` |
| `--z-notice` | 根值，见 DESIGN | `floating.css`, `layout.css` |
| `--chart-color-1` | `--palette-series-1` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-color-2` | `--palette-series-2` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-color-3` | `--palette-series-3` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-color-4` | `--palette-series-4` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-color-5` | `--palette-series-5` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-color-6` | `--palette-series-6` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-axis-foreground` | `--muted-foreground` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-grid-color` | `--separator-line` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-tooltip-background` | `--layer-overlay` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-tooltip-foreground` | `--foreground` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-axis-font-size` | `--font-size-caption` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-legend-font-size` | `--font-size-body-xs` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-line-width` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--chart-line-width-emphasis` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--diagram-node-fill` | `--interaction-selected` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--diagram-node-stroke` | `--surface-line-strong` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--diagram-node-text` | `--foreground` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--diagram-edge` | `--muted-foreground` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--diagram-caption` | `--foreground` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-canvas` | `--palette-document-canvas` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-diagram-node-fill` | `--palette-document-node-fill` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-diagram-node-stroke` | `--palette-document-node-stroke` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-diagram-node-text` | `--palette-document-node-text` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-diagram-edge` | `--palette-document-edge` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-diagram-caption` | `--palette-document-caption` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-chart-1` | `--palette-document-series-1` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-chart-2` | `--palette-document-series-2` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-chart-3` | `--palette-document-series-3` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-chart-4` | `--palette-document-series-4` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-chart-5` | `--palette-document-series-5` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--document-chart-6` | `--palette-document-series-6` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-content-inset` | `--spacing` | `layout.css` |
| `--layout-content-inset-narrow` | `--spacing` | `layout.css` |
| `--layout-content-max` | 根值，见 DESIGN | `layout.css` |
| `--layout-section-gap` | `--space-section-gap` | `layout.css` |
| `--layout-toolbar-gap` | `--space-control-gap` | `layout.css`, `search-toolbar.css` |
| `--layout-field-gap` | `--space-section-gap` | `layout.css` |
| `--layout-field-min` | 根值，见 DESIGN | `layout.css` |
| `--layout-field-long-min` | 根值，见 DESIGN | `table.css` |
| `--layout-header-height` | `--spacing` | `layout.css` |
| `--layout-dialog-width` | `--layout-dialog-min-width`、`--layout-dialog-width-ratio`、`--layout-dialog-max-width` | `dialog.css` |
| `--layout-confirm-width` | `--layout-confirm-min-width`、`--layout-confirm-width-ratio`、`--layout-confirm-max-width` | `sheet.css` |
| `--layout-drawer-width` | `--layout-drawer-min-width`、`--layout-drawer-width-ratio`、`--layout-drawer-max-width` | `sheet.css` |
| `--layout-viewport-inset` | `--space-section-gap` | `auth.css`, `dialog.css`, `floating.css`, `layout.css`, `sheet.css` |
| `--button-height` | `--control-height` | `button.css`, `navigation.css` |
| `--button-padding-inline` | `--space-content-gap` | `button.css`, `search-toolbar.css` |
| `--button-gap` | `--space-icon-gap` | `button.css`, `search-toolbar.css` |
| `--button-radius` | `--radius-md` | `button.css` |
| `--button-background` | `--action-primary` | `button.css` |
| `--button-foreground` | `--action-primary-foreground` | `button.css` |
| `--input-height` | `--control-height` | `forms.css` |
| `--input-radius` | `--radius-md` | `forms.css` |
| `--input-background` | `--input-surface` | `forms.css` |
| `--input-foreground` | `--foreground` | `forms.css` |
| `--input-border-color` | `--input` | `forms.css` |
| `--card-background` | `--layer-raised` | `feedback.css` |
| `--card-border-color` | `--surface-line` | `feedback.css` |
| `--card-radius` | `--radius-lg` | `feedback.css` |
| `--card-padding` | `--spacing` | `feedback.css` |
| `--card-padding-small` | `--spacing` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--menu-min-width` | 根值，见 DESIGN | `floating.css` |
| `--menu-item-min-height` | `--spacing` | `floating.css` |
| `--menu-padding` | `--space-text-gap` | `floating.css` |
| `--menu-radius` | `--radius-xl` | `floating.css` |
| `--floating-offset` | `--space-text-gap` | `floating.css` |
| `--popover-width` | 根值，见 DESIGN | `floating.css` |
| `--popover-padding` | `--space-content-gap` | `floating.css` |
| `--tooltip-max-width` | 根值，见 DESIGN | `floating.css` |
| `--table-cell-padding` | `--space-control-gap` | `table.css` |
| `--table-action-gap` | `--space-text-gap` | `table.css` |
| `--metric-padding` | `--space-content-gap` | `feedback.css` |
| `--metric-gap` | `--space-text-gap` | `feedback.css` |
| `--button-hover-background` | `--action-primary`、`--layer-raised` | `button.css` |
| `--button-pressed-background` | `--action-primary`、`--foreground` | `button.css` |
| `--button-disabled-background` | `--muted` | `button.css`, `forms.css` |
| `--button-disabled-foreground` | `--muted-foreground` | `button.css`, `forms.css` |
| `--menu-item-background` | 根值，见 DESIGN | `floating.css`, `navigation.css` |
| `--menu-item-foreground` | `--foreground` | `floating.css`, `navigation.css` |
| `--menu-item-hover-background` | `--interaction-hover` | `floating.css`, `navigation.css` |
| `--menu-item-hover-foreground` | `--interaction-hover-foreground` | `floating.css`, `navigation.css` |
| `--menu-item-selected-background` | `--interaction-selected` | `floating.css`, `navigation.css` |
| `--menu-item-selected-foreground` | `--interaction-selected-foreground` | `floating.css`, `navigation.css` |
| `--menu-item-focus-color` | `--interaction-focus` | `floating.css`, `navigation.css` |
| `--menu-item-disabled-foreground` | `--muted-foreground` | `floating.css`, `navigation.css` |
| `--menu-item-radius` | `--radius-md` | `floating.css` |
| `--menu-item-padding-inline` | `--space-control-gap` | `floating.css` |
| `--menu-item-gap` | `--space-control-gap` | `floating.css` |
| `--chart-min-block-size` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--nav-item-height` | `--control-height` | `layout.css`, `navigation.css` |
| `--nav-item-gap` | `--space-control-gap` | `navigation.css` |
| `--nav-item-radius` | `--radius-md` | `navigation.css` |
| `--nav-selected-indicator-color` | `--action-primary` | `navigation.css` |
| `--nav-selected-indicator-width` | `--line-width-emphasis` | `navigation.css` |
| `--nav-selected-indicator-height` | 根值，见 DESIGN | `navigation.css` |
| `--nav-selected-indicator-radius` | `--nav-selected-indicator-width` | `navigation.css` |
| `--nav-selected-indicator-inset` | `--space-text-gap` | `navigation.css` |
| `--nav-selected-indicator-gap` | `--space-icon-gap` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--nav-item-padding-inline` | `--nav-selected-indicator-inset`、`--nav-selected-indicator-width`、`--nav-selected-indicator-gap` | `layout.css`, `navigation.css` |
| `--nav-collapsed-item-size` | 根值，见 DESIGN | `navigation.css` |
| `--nav-selected-indicator-inset-collapsed` | 根值，见 DESIGN | `navigation.css` |
| `--nav-sidebar-width` | `--nav-item-height` | `layout.css` |
| `--nav-sidebar-padding` | `--space-content-gap` | `layout.css` |
| `--nav-collapsed-width` | `--nav-collapsed-item-size`、`--nav-sidebar-padding` | `layout.css` |
| `--layout-header-primary-min` | `--layout-field-min` | `layout.css` |
| `--dialog-body-min-block-size` | `--control-height`、`--focus-width`、`--focus-offset` | `dialog.css` |
| `--button-padding-block-xs` | `--control-height-xs`、`--line-height-body-sm`、`--line-width-surface` | `button.css` |
| `--font-scale` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--line-height-scale` | `--font-scale` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--radius-full` | 根值，见 DESIGN | `feedback.css`, `forms.css`, `widgets.css` |
| `--icon-stroke-width` | 根值，见 DESIGN | `forms.css`, `layout.css` |
| `--nav-icon-stroke-width` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--illustration-icon-size` | 根值，见 DESIGN | `base.css` |
| `--nav-sidebar-header-max` | 根值，见 DESIGN | `layout.css` |
| `--a11y-hidden-size` | 根值，见 DESIGN | `auth.css`, `layout.css`, `navigation.css` |
| `--a11y-hidden-offset` | `--a11y-hidden-size` | `auth.css`, `layout.css`, `navigation.css` |
| `--a11y-skip-hidden-offset` | 根值，见 DESIGN | `layout.css` |
| `--progress-forced-track` | 根值，见 DESIGN | `feedback.css` |
| `--progress-forced-border` | 根值，见 DESIGN | `feedback.css` |
| `--progress-forced-fill` | 根值，见 DESIGN | `feedback.css` |
| `--progress-forced-pending-border-style` | 根值，见 DESIGN | `feedback.css` |
| `--motion-feedback-opacity-start` | 根值，见 DESIGN | `base.css`, `feedback.css` |
| `--motion-duration-pulse` | `--motion-duration` | `feedback.css` |
| `--motion-duration-spin` | `--motion-duration` | `feedback.css` |
| `--motion-disclosure-rotation` | 根值，见 DESIGN | `layout.css`, `navigation.css`, `widgets.css` |
| `--motion-spin-rotation` | 根值，见 DESIGN | `feedback.css` |
| `--button-padding-inline-sm` | `--spacing` | `button.css`, `forms.css` |
| `--button-danger-hover-background` | `--action-danger`、`--foreground` | `button.css` |
| `--button-danger-pressed-background` | `--action-danger`、`--foreground` | `button.css` |
| `--backdrop-background` | `--foreground` | `dialog.css` |
| `--feedback-slot-block-size` | `--control-height`、`--space-content-gap`、`--focus-width`、`--focus-offset` | `feedback.css`, `table.css` |
| `--data-region-min-block-size` | `--control-height` | `feedback.css` |
| `--textarea-min-block-size` | `--input-height` | `forms.css` |
| `--range-thumb-offset` | `--space-control-gap`、`--control-icon-size`、`--line-width-surface` | `forms.css` |
| `--choice-check-width` | `--spacing` | `forms.css` |
| `--choice-check-height` | `--spacing` | `forms.css` |
| `--choice-check-rotation` | 根值，见 DESIGN | `forms.css` |
| `--switch-width` | `--spacing` | `forms.css` |
| `--switch-height` | `--spacing` | `forms.css` |
| `--switch-thumb-size` | `--spacing` | `forms.css` |
| `--switch-travel` | `--spacing` | `forms.css` |
| `--switch-width-sm` | `--spacing` | `forms.css` |
| `--switch-height-sm` | `--spacing` | `forms.css` |
| `--switch-thumb-size-sm` | `--spacing` | `forms.css` |
| `--switch-travel-sm` | `--spacing` | `forms.css` |
| `--switch-width-lg` | `--spacing` | `forms.css` |
| `--switch-height-lg` | `--spacing` | `forms.css` |
| `--switch-thumb-size-lg` | `--spacing` | `forms.css` |
| `--switch-travel-lg` | `--spacing` | `forms.css` |
| `--layout-header-brand-max` | 根值，见 DESIGN | `layout.css` |
| `--nav-sidebar-footer-max` | 根值，见 DESIGN | `layout.css` |
| `--nav-sidebar-min-height` | `--nav-item-height` | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--nav-drawer-max-inline-size` | `--nav-item-height` | `layout.css` |
| `--nav-toggle-transform-origin` | 根值，见 DESIGN | `layout.css` |
| `--login-card-padding` | `--space-section-gap` | `auth.css` |
| `--login-form-inline-size` | 根值，见 DESIGN | `auth.css` |
| `--login-card-padding-end` | `--space-content-gap` | `auth.css` |
| `--login-heading-gap` | `--space-control-gap` | `auth.css` |
| `--login-heading-fields-gap` | `--space-section-gap` | `auth.css` |
| `--login-control-height` | `--control-height-lg`、`--space-text-gap` | `auth.css` |
| `--login-group-input-height` | `--login-control-height`、`--line-width-surface` | `auth.css` |
| `--login-control-font-size` | `--font-size-body-sm` | `auth.css` |
| `--login-control-line-height` | `--line-height-body-sm` | `auth.css` |
| `--login-card-inline-size` | `--login-form-inline-size`、`--login-card-padding`、`--line-width-surface` | `auth.css` |
| `--login-visual-max-block-size` | `--control-height-lg` | `auth.css` |
| `--login-action-max-block-size` | `--login-control-height` | `auth.css` |
| `--login-logo-size` | `--control-height-sm` | `auth.css` |
| `--sheet-max-block-size` | 根值，见 DESIGN | `sheet.css` |
| `--tabs-padding` | `--spacing` | `navigation.css` |
| `--layout-workspace-content-min-block-size` | 根值，见 DESIGN | `layout.css` |
| `--data-table-filter-min` | 根值，见 DESIGN | `table.css` |
| `--data-table-min-block-size` | `--control-height` | `table.css` |
| `--table-min-inline-size` | `--control-height` | `table.css` |
| `--z-sticky-intersection` | `--z-sticky` | `table.css` |
| `--avatar-size-lg` | `--control-height` | `widgets.css` |
| `--calendar-max-inline-size` | `--control-height` | `widgets.css` |
| `--layout-scroll-area-height` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-table-viewport-height` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-embedded-shell-height` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-demo-sidebar-width` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-demo-max` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-dialog-width-ratio` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-dialog-min-width` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-dialog-max-width` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-confirm-width-ratio` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-confirm-min-width` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-confirm-max-width` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-drawer-width-ratio` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-drawer-min-width` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-drawer-max-width` | 根值，见 DESIGN | 由其他 token/继承/公共宿主消费，需单独核引用 |
| `--layout-sheet-block-size` | 根值，见 DESIGN | `sheet.css` |
| `--table-header-background` | `--layer-support` | `table.css` |
| `--table-header-foreground` | `--muted-foreground` | `table.css` |
| `--table-row-background` | `--layer-raised` | `table.css` |
| `--table-row-stripe-background` | `--palette-table-stripe` | `table.css` |
| `--table-row-expanded-background` | `--interaction-hover` | `table.css` |
| `--table-header-min-height` | `--control-height` | `table.css` |
| `--table-row-min-height` | `--control-height-lg` | `table.css` |
| `--table-cell-padding-inline` | `--space-content-gap` | `table.css` |
