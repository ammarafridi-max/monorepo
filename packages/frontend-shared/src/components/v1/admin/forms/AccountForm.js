'use client';

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGetMyAccount } from '../../../../hooks/account/useGetMyAccount.js';
import { useUpdateMyAccount } from '../../../../hooks/account/useUpdateMyAccount.js';
import FormRow from '../../form-elements/FormRow.js';
import Input from '../../form-elements/Input.js';
import Label from '../../form-elements/Label.js';
import PrimaryButton from '../../PrimaryButton.js';
import PageHeading from '../../layout/PageHeading.js';

export default function AccountForm() {
  const [updateMode, setUpdateMode] = useState(false);
  const { account, isLoading } = useGetMyAccount();
  const { updateAccount, isUpdating } = useUpdateMyAccount();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      email: "",
      username: "",
    },
  });

  async function onSubmit(data) {
    await updateAccount(data);
    setUpdateMode(false);
  }

  useEffect(() => {
    if (account) {
      reset({
        name: account?.name,
        email: account?.email,
        username: account?.username,
      });
    }
  }, [account, reset]);

  if (isLoading) return <p>Loading...</p>;

  return (
    <>
      <PageHeading>My Account</PageHeading>
      <form
        className="flex flex-col gap-4 px-10 py-6 mt-5 bg-white rounded-lg shadow-md"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormRow>
          <Label>Name</Label>
          <Input
            type="text"
            disabled={isUpdating || !updateMode}
            {...register("name")}
          />
        </FormRow>
        <FormRow>
          <Label>Email</Label>
          <Input type="text" disabled={true} {...register("email")} />
        </FormRow>
        <FormRow>
          <Label>Username</Label>
          <Input
            type="text"
            disabled={isUpdating || !updateMode}
            {...register("username")}
          />
        </FormRow>
        <div className="flex items-center gap-2.5 mt-5">
          {!updateMode && (
            <PrimaryButton type="button" onClick={() => setUpdateMode(true)}>
              Edit
            </PrimaryButton>
          )}
          {updateMode && (
            <PrimaryButton type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update"}
            </PrimaryButton>
          )}
        </div>
      </form>
    </>
  );
}
