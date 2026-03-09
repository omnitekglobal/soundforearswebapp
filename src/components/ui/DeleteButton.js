"use client";

export default function DeleteButton({
  action,
  children = "Delete",
  confirmMessage = "Are you sure you want to delete this item? This action cannot be undone.",
}) {
  return (
    <form
      action={action}
      className="inline"
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-red-600 hover:underline">
        {children}
      </button>
    </form>
  );
}

