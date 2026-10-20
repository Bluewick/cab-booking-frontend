import React, { useState } from 'react';
import { Star, CheckCircle2, ThumbsUp, Sparkles, MessageSquare } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import useToast from '../../hooks/useToast';
import reviewService from '../../services/review.service';

const COMPLIMENT_TAGS = [
  'Punctual & Prompt',
  'Clean & Fresh Cab',
  'Smooth & Safe Driving',
  'Polite & Professional',
  'Great Route Choice',
  'Comfortable Ride',
];

/**
 * Obsidian Geist Driver Rating & Compliments Dialog
 * Interactively collects 1-5 star ratings, feedback tags, and written reviews.
 * Adheres strictly to DESIGN.md Section 3 & 4.
 */
export default function RatingModal({
  isOpen,
  onClose,
  ride = null,
  onSubmitSuccess = null,
}) {
  const toast = useToast();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['Smooth & Safe Driving']);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ride?.id) return;

    try {
      setSubmitting(true);
      // Combine selected tags with text comment
      const finalComment = [
        selectedTags.length > 0 ? `[${selectedTags.join(', ')}]` : '',
        comment.trim(),
      ]
        .filter(Boolean)
        .join(' ');

      const res = await reviewService.submitReview({
        ride_id: ride.id,
        rating: Number(rating),
        comment: finalComment || 'Great trip experience.',
      });

      setSubmitted(true);
      toast.success(
        `Thank you for rating! Driver's updated score: ${res.updated_driver_rating || '5.0'} ★`,
        'Feedback Submitted'
      );

      if (onSubmitSuccess) {
        onSubmitSuccess(res);
      }

      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 1500);
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarCount = hoverRating || rating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rate Your Experience"
      description={
        ride?.driver_name
          ? `How was your journey with ${ride.driver_name}?`
          : 'Rate your driver partner and share compliments.'
      }
      size="md"
    >
      {submitted ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
          <div className="size-14 rounded-full bg-[#052E16] border border-[#10B981] flex items-center justify-center text-[#34D399] shadow-[0_0_24px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="size-7" />
          </div>
          <h3 className="text-base font-bold text-[#FAFAFA]">Review Submitted!</h3>
          <p className="text-xs text-[#A1A1AA] max-w-xs">
            Your evaluation helps us maintain peak chauffeur standards across the UrbanCab network.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-1">
          {/* Driver Mini Card */}
          {ride?.driver_name && (
            <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[#141418] border border-[#27272A]">
              <div className="size-10 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-sm font-bold text-[#FAFAFA]">
                {ride.driver_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#FAFAFA] truncate">
                  {ride.driver_name}
                </span>
                <span className="text-[11px] text-[#71717A] truncate font-mono">
                  {ride.vehicle_color} {ride.vehicle_make} {ride.vehicle_model} •{' '}
                  <span className="text-[#60A5FA]">{ride.vehicle_plate || 'CAB-VERIFIED'}</span>
                </span>
              </div>
            </div>
          )}

          {/* Interactive 5-Star Selection */}
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const filled = starVal <= activeStarCount;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${starVal} Stars`}
                    className="p-1 rounded-[6px] hover:scale-115 transition-transform cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`size-8 transition-colors ${
                        filled
                          ? 'fill-[#FBBF24] text-[#FBBF24] drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                          : 'text-[#3F3F46] hover:text-[#71717A]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-mono font-semibold text-[#FAFAFA] mt-1">
              {activeStarCount === 5 && '★★★★★ Exceptional Service'}
              {activeStarCount === 4 && '★★★★☆ Great Trip'}
              {activeStarCount === 3 && '★★★☆☆ Average Transit'}
              {activeStarCount === 2 && '★★☆☆☆ Below Expectations'}
              {activeStarCount === 1 && '★☆☆☆☆ Unsatisfactory'}
            </span>
          </div>

          {/* Quick Compliment Tags */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase text-[#A1A1AA] flex items-center gap-1.5">
              <Sparkles className="size-3 text-[#FBBF24]" />
              Select Compliments (Optional)
            </span>

            <div className="flex flex-wrap gap-1.5">
              {COMPLIMENT_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[rgba(59,130,246,0.15)] text-[#60A5FA] border-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                        : 'bg-[#141418] text-[#A1A1AA] border-[#27272A] hover:border-[#3F3F46] hover:text-[#FAFAFA]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Written Comments */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] flex items-center gap-1.5">
              <MessageSquare className="size-3 text-[#71717A]" />
              Additional Remarks
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share specific praise or observations regarding your journey..."
              className="w-full bg-[#141418] text-[#FAFAFA] text-xs rounded-[9px] border border-[#27272A] p-3 focus:outline-none focus:border-[#FAFAFA] focus:ring-1 focus:ring-white/10 placeholder-[#71717A] leading-relaxed resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272A]/70">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={submitting}
            >
              Skip
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              loadingText="Submitting..."
              icon={ThumbsUp}
              className="font-semibold"
            >
              Submit Review ({rating} ★)
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
