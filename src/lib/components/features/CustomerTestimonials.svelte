<script lang="ts">
  const testimonials = [
    {
      quote:
        'Agreed lets our reps close +90% of deals without help from legal.',
      name: 'Maya Chen',
      role: 'VP of Sales',
      company: 'Northstar'
    },
    {
      quote:
        'Agreed cut our sales cycle by 30% on deals under $50k.',
      name: 'Daniel Brooks',
      role: 'CRO',
      company: 'Relay'
    }
  ];
</script>

<div class="grid gap-[34px] md:grid-cols-2 md:gap-x-[48px]">
  {#each testimonials as testimonial}
    <figure class="border-t border-line pt-[18px] sm:pt-[20px]">
      <blockquote
        class="font-heading text-[18px] font-book italic leading-[1.42] text-ink sm:text-[20px]"
      >
        “{testimonial.quote}”
      </blockquote>

      <figcaption class="mt-[14px] flex flex-wrap items-baseline gap-x-[6px] gap-y-[4px] text-[14px] font-book leading-[1.3] sm:text-[15px]">
        <span class="text-ink">{testimonial.name}</span>
        <span class="text-ink-muted">{testimonial.role}, {testimonial.company}</span>
      </figcaption>
    </figure>
  {/each}
</div>
