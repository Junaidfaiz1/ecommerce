import { z } from 'zod';
import {
  buildIdOrSlugSchema,
  deleteBuildInputSchema,
  duplicateBuildInputSchema,
  previewBuildInputSchema,
  saveBuildInputSchema,
} from '@vorqen/types';

export const previewBuildArgsSchema = z
  .object({
    input: previewBuildInputSchema,
  })
  .strict();

export const saveBuildArgsSchema = z
  .object({
    input: saveBuildInputSchema,
  })
  .strict();

export const duplicateBuildArgsSchema = z
  .object({
    input: duplicateBuildInputSchema,
  })
  .strict();

export const deleteBuildArgsSchema = z
  .object({
    input: deleteBuildInputSchema,
  })
  .strict();

export const buildArgsSchema = buildIdOrSlugSchema;
