"use client";

import type { Label as LabelPrimitive } from "radix-ui";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { cn } from "../lib";
import { Label } from "./label";

const Form = FormProvider;

type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
	{} as FormFieldContextValue,
);

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
};

const useFormField = () => {
	const fieldContext = React.useContext(FormFieldContext);
	const itemContext = React.useContext(FormItemContext);
	const { getFieldState, formState } = useFormContext();

	const fieldState = getFieldState(fieldContext.name, formState);

	if (!fieldContext) {
		throw new Error("useFormField should be used within <FormField>");
	}

	const { id } = itemContext;

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};

type FormItemContextValue = {
	id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
	{} as FormItemContextValue,
);

const FormItem = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => {
	const id = React.useId();

	return (
		<FormItemContext.Provider value={{ id }}>
			<div className={cn("space-y-1.5", className)} {...props} />
		</FormItemContext.Provider>
	);
};

const FormLabel = ({
	className,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) => {
	const { error, formItemId } = useFormField();

	return (
		<Label
			className={cn(
				"block font-medium",
				error && "text-destructive",
				className,
			)}
			htmlFor={formItemId}
			{...props}
		/>
	);
};

const FormControl = ({
	...props
}: React.ComponentProps<typeof SlotPrimitive.Slot>) => {
	const { error, formItemId, formDescriptionId, formMessageId } =
		useFormField();

	return (
		<SlotPrimitive.Slot
			id={formItemId}
			aria-describedby={
				error
					? `${formDescriptionId} ${formMessageId}`
					: `${formDescriptionId}`
			}
			aria-invalid={!!error}
			{...props}
		/>
	);
};

const FormDescription = ({
	className,
	...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
	const { formDescriptionId } = useFormField();

	return (
		<p
			id={formDescriptionId}
			className={cn("text-foreground/60 text-sm", className)}
			{...props}
		/>
	);
};

/**
 * Pulls the first real message out of a react-hook-form error.
 *
 * For a scalar field the error is `{ message }` and this is trivial. For an
 * array field it is a sparse *array* of per-element errors whose own `.message`
 * is `undefined` — so the previous `String(error.message)` rendered the literal
 * text "undefined" under the field, and the message the schema actually defined
 * could never be shown. Nested objects have the same shape one level down.
 */
function getFirstErrorMessage(error: unknown): string | undefined {
	if (!error || typeof error !== "object") {
		return undefined;
	}

	const { message } = error as { message?: unknown };
	if (typeof message === "string" && message.length > 0) {
		return message;
	}

	// Sparse arrays are why this is a `for…in`: only populated indexes are
	// visited, and only the entries react-hook-form actually wrote exist.
	for (const key in error) {
		// `ref` points at the DOM node and `type` names the failed rule; neither
		// carries a message, and `ref` would recurse into the whole element.
		if (key === "ref" || key === "type") {
			continue;
		}
		const nested = getFirstErrorMessage(
			(error as Record<string, unknown>)[key],
		);
		if (nested) {
			return nested;
		}
	}

	return undefined;
}

const FormMessage = ({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
	const { error, formMessageId } = useFormField();
	// Falling back to `children` rather than to nothing keeps a field that is
	// flagged `aria-invalid` from being left with no explanation at all.
	const body = (error ? getFirstErrorMessage(error) : undefined) ?? children;

	if (!body) {
		return null;
	}

	return (
		<p
			id={formMessageId}
			className={cn("font-normal text-destructive text-sm", className)}
			{...props}
		>
			{body}
		</p>
	);
};

export {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	useFormField,
};
