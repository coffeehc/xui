import {DateTimePicker,type DateTimePickerProps,type DateTimeValue} from '@coffeehc/xui-react/date-time';
import {createDateTimeModel,parseDateTimeValue,type DateTimeOptions} from '@coffeehc/xui-runtime/date-time';
import {createDateTimePicker,type NativeDateTimePickerOptions} from '@coffeehc/xui-runtime/date-time-dom';
import {DateTimePicker as RootPicker} from '@coffeehc/xui-react';
import {createDateTimePicker as rootNative} from '@coffeehc/xui-runtime';
const value:DateTimeValue='2026-10-15T09:30';const options:DateTimeOptions={value,onValueChange:next=>{const text:string|null=next;}};
const props:DateTimePickerProps={...options,label:'开始',required:true,readOnly:true,labels:{hour:'时'}};
const native:NativeDateTimePickerOptions={...options,label:'开始',form:'window'};
<DateTimePicker {...props}/>;<RootPicker {...props}/>;createDateTimeModel(options).destroy();parseDateTimeValue(value);createDateTimePicker(document.createElement('div'),native).destroy();rootNative(document.createElement('div'),native).destroy();
// @ts-expect-error Date objects are not date-time values.
<DateTimePicker label="开始" value={new Date()}/>;
// @ts-expect-error Numeric instants are not date-time values.
createDateTimeModel({value:123});
// @ts-expect-error A visible field label is required.
<DateTimePicker value={null}/>;
