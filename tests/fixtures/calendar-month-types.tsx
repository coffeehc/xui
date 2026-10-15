import {Calendar,type CalendarProps} from '@coffeehc/xui-react/calendar';
import {createCalendarModel,type CalendarOptions} from '@coffeehc/xui-runtime/calendar';
import type {CalendarProps as RootProps} from '@coffeehc/xui-react';
import type {CalendarOptions as RootOptions} from '@coffeehc/xui-runtime';
const options:CalendarOptions={month:'2026-10',onMonthChange:month=>month.toUpperCase()};
const rootOptions:RootOptions=options;
const props:RootProps={...rootOptions};
export const example=<Calendar {...props}/>;
const model=createCalendarModel(options);model.setMonth('2020-01');model.update({month:'2020-02'});model.destroy();
// @ts-expect-error Months are ISO date-only strings, never Date instants.
const invalid:CalendarProps={month:new Date()};
// @ts-expect-error Viewed-month events do not carry CalendarValue.
const invalidHandler:CalendarOptions={onMonthChange:(date:Date)=>{}};
